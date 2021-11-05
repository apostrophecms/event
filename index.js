const fs = require('fs');
const path = require('path');
const dayjs = require('dayjs');

module.exports = {
  extend: '@apostrophecms/event',
  bundle: {
    directory: 'modules',
    modules: getBundleModuleNames()
  },
  fields: {
    add: {
      image: {
        label: 'Headline photo',
        type: 'area',
        options: {
          max: 1,
          widgets: {
            '@apostrophecms/image': {}
          }
        },
        required: false
      }
    },
    group: {
      basics: {
        label: 'Basics',
        fields: [
          'title',
          'slug',
          'image',
          'description',
          'startDate',
          'allDay',
          'startTime',
          'endTime'
        ]
      }
    }
  }
};

function getBundleModuleNames() {
  const source = path.join(__dirname, './modules/@bulldoguk');
  return fs
    .readdirSync(source, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => `@bulldoguk/${dirent.name}`);
}
