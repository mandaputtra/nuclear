import _, { flow, omit, unionWith } from 'lodash';
import { store, Track } from '@nuclear/core';
import { areTracksEqualByName, getTrackItem } from '@nuclear/ui';

import { safeAddUuid } from './helpers';
import { createStandardAction } from 'typesafe-actions';
import { addToDownloads } from './downloads';
import StreamProviderPlugin from '@nuclear/core/src/plugins/streamProvider';

export const READ_FAVORITES = 'READ_FAVORITES';
export const ADD_FAVORITE_TRACK = 'ADD_FAVORITE_TRACK';
export const REMOVE_FAVORITE_TRACK = 'REMOVE_FAVORITE_TRACK';
export const BULK_ADD_FAVORITE_TRACKS = 'BULK_ADD_FAVORITE_TRACKS';

export const ADD_FAVORITE_ALBUM = 'ADD_FAVORITE_ALBUM';
export const REMOVE_FAVORITE_ALBUM = 'REMOVE_FAVORITE_ALBUM';

export const ADD_FAVORITE_ARTIST = 'ADD_FAVORITE_ARTIST';
export const REMOVE_FAVORITE_ARTIST = 'REMOVE_FAVORITE_ARTIST';

export function readFavorites() {
  const favorites = store.get('favorites');
  return {
    type: READ_FAVORITES,
    payload: favorites
  };
}

export function addFavoriteTrack(track) {
  const clonedTrack = flow(safeAddUuid, getTrackItem)(track);
  
  const favorites = store.get('favorites');
  const filteredTracks = favorites.tracks.filter(t => !areTracksEqualByName(t, track));
  favorites.tracks = [...filteredTracks, omit(clonedTrack, 'streams')];
  
  store.set('favorites', favorites);

  const settings = store.get('settings');
  const autoDownloadFavourites = settings.autoDownloadFavourites;
  
  if (autoDownloadFavourites) {
    const streamProviders: StreamProviderPlugin[] = store.get('StreamProvider') || [];
    
    addToDownloads(streamProviders, track);
  }
  
  return {
    type: ADD_FAVORITE_TRACK,
    payload: favorites
  };
}

const bulkAddFavoriteTracksAction = createStandardAction(BULK_ADD_FAVORITE_TRACKS)<Track[]>();

export const bulkAddFavoriteTracks = (tracks: Track[]) => {
  const favorites = store.get('favorites');
  favorites.tracks = unionWith(favorites.tracks, tracks, areTracksEqualByName);
  store.set('favorites', favorites);

  return bulkAddFavoriteTracksAction(favorites);
};

export function removeFavoriteTrack(track) {
  const favorites = store.get('favorites');
  favorites.tracks = favorites.tracks.filter(t => !areTracksEqualByName(t, track));

  store.set('favorites', favorites);

  return {
    type: REMOVE_FAVORITE_TRACK,
    payload: favorites
  };
}

export function addFavoriteAlbum(album) {
  const favorites = store.get('favorites');
  favorites.albums = _.concat(favorites.albums, album);
  store.set('favorites', favorites);

  return {
    type: ADD_FAVORITE_ALBUM,
    payload: favorites
  };
}

export function removeFavoriteAlbum(album) {
  const favorites = store.get('favorites');
  _.remove(favorites.albums, {
    artist: album.artist,
    title: album.title
  });
  store.set('favorites', favorites);

  return {
    type: REMOVE_FAVORITE_ALBUM,
    payload: favorites
  };
}

export function addFavoriteArtist(artist) {
  
  const favorites = store.get('favorites');
  const savedArtist = {
    id: artist.id,
    name: artist.name,
    source: artist.source,
    coverImage: artist.coverImage,
    thumb: artist.thumb
  };

  favorites.artists = _.concat(favorites.artists || [], savedArtist);
  store.set('favorites', favorites);
  
  return {
    type: ADD_FAVORITE_ARTIST,
    payload: favorites
  };
}

export function removeFavoriteArtist(artist) {
  const favorites = store.get('favorites');
  _.remove(favorites.artists, {
    id: artist.id,
    name: artist.name
  });
  store.set('favorites', favorites);

  return {
    type: REMOVE_FAVORITE_ARTIST,
    payload: favorites
  };
}
