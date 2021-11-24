module.exports = {
  extend: '@apostrophecms/piece-page-type',
  options: {
    label: 'Event Page',
    piecesFilters: [
      { name: 'year' },
      { name: 'month' },
      { name: 'day' }
    ]
  }
};
