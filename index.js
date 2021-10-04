const fs = require('fs');
const path = require('path');
const _ = require('@sailshq/lodash')
const moment = require('moment')

module.exports = {
  extend: '@apostrophecms/piece-type',
  bundle: {
    directory: 'modules',
    modules: getBundleModuleNames()
  },
  options: {
    label: 'Event',
    pluralLabel: 'Events',
    sort: { startDate: 1, startTime: 1 },
  },
  columns: {
    add: {
      startDate: {
        label: 'Start Date'
      },
      startTime: {
        label: 'Start Time'
      }
    }
  },
  options: {
    label: 'Event',
    pluralLabel: 'Events',
    sort: { startDate: 1, startTime: 1 },
  },
  columns: {
    add: {
      startDate: {
        label: 'Start Date'
      },
      startTime: {
        label: 'Start Time'
      }
    }
  },
  filters: {
    add: {
      upcoming: {
        type: 'select',
        label: 'Upcoming',
        choices: [
          {
            value: true,
            label: 'Upcoming'
          }, {
            value: false,
            label: 'Past'
          }, {
            value: null,
            label: 'Both'
          }
        ],
        def: true
      }
    }
  },
  fields: {
    add: {
      startDate: {
        label: 'Start date',
        type: 'date',
        required: true
      },
      allDay: {
        label: 'Is this an all day event?',
        type: 'boolean',
        choices: [
          {
            label: 'Yes',
            value: true
          },
          {
            label: 'No',
            value: false,
            showFields: ['startTime', 'endTime']
          }
        ],
        def: false
      },
      startTime: {
        label: 'Start time',
        type: 'time',
        def: '09:00 AM',
        required: true,
        if: {
          allDay: false
        }
      },
      endTime: {
        label: 'End time',
        type: 'time',
        def: '05:30 PM',
        required: true,
        if: {
          allDay: false
        }
      },
      dateType: {
        label: 'What type of event is this?',
        help: 'Select if the event is on a single day, consecutive days, or repeats.',
        type: 'select',
        choices: [
          {
            label: 'Single Day',
            value: 'single'
          },
          {
            label: 'Consecutive Days',
            value: 'consecutive'
          },
          {
            label: 'Recurring',
            value: 'repeat',
          }
        ],
        def: 'single'
      },
      enddate: {
        label: 'End date',
        type: 'date',
        if: {
          dateType: 'consecutive'
        }
      },
      repeatInterval: {
        label: 'How often does the event repeat?',
        type: 'select',
        choices: [
          {
            label: 'Every week',
            value: 'weeks'
          },
          {
            label: 'Every month',
            value: 'months'
          }
        ],
        if: {
          dateType: 'repeat'
        }
      },
      repeatCount: {
        label: 'How many times does it repeat?',
        type: 'integer',
        def: 1,
        if: {
          dateType: 'repeat'
        }
      },
      description: {
        type: 'string',
        label: 'Description',
        textarea: true,
        required: true
      },
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
        fields: ['title', 'slug', 'description', 'startDate', 'allDay', 'startTime', 'endTime']
      },
      advanced: {
        label: 'Advanced',
        fields: ['dateType', 'enddate', 'repeatInterval', 'repeatCount']
      },
      meta: {
        label: 'Meta',
        fields: ['tags', 'published']
      }
    }
  },

  handlers(self, options) {
    return {

      'beforeSave': {
        async beforeSaveHandler(req, piece, options) {
          self.denormalizeDatesAndTimes(piece)
          console.log('starttime', piece.startTime)
        }
      },

      'denormalizeDatesAndTimes': function (piece) {
        // Parse our dates and times
        let startTime = piece.startTime
        let startDate = piece.startDate
        let endTime = piece.endTime
        let enddate

        if (piece.dateType === 'consecutive') {
          enddate = piece.enddate
        } else {
          piece.enddate = piece.startDate
          enddate = piece.startDate
        }

        if (piece.allDay) {
          console.log('allDay', piece.allDay)
          startTime = '00:00:00'
          endTime = '23:59:59'
        }

        if (piece.dateType === 'repeat') {
          piece.hasClones = true
        }

        piece.start = new Date(startDate + ' ' + startTime)
        piece.end = new Date(enddate + ' ' + endTime)
      }
    }
  }
}

function getBundleModuleNames() {
  const source = path.join(__dirname, './modules/@apostrophecms');
  return fs
    .readdirSync(source, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => `@apostrophecms/${dirent.name}`);
}
