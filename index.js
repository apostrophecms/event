const fs = require('fs')
const path = require('path')
const dayjs = require('dayjs')

const fullDateRegex = /^\d\d\d\d-\d\d-\d\d$/

module.exports = {
  extend: '@apostrophecms/piece-type',
  bundle: {
    directory: 'modules',
    modules: getBundleModuleNames()
  },
  options: {
    label: 'Event',
    pluralLabel: 'Events',
    sort: { start: 1 },
  },
  filters: {
    add: {
      upcoming: {
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
        def: true,
      }
    }
  },
  columns: {
    add: {
      start: {
        label: 'Start'
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
        fields: ['title', 'slug', 'description', 'image', 'startDate', 'allDay', 'startTime', 'endTime']
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
      beforeSave: {
        async denormalizeDateTimes(req, piece, options) {
          self.denormalizeDatesAndTimes(piece)
        }
      },
      beforeInsert: {
        setGroupId(req, piece, options) {
          // Set groupId on parent if this is a repeating item
          if (piece.dateType === 'repeat' && !piece.groupId && !self._workflowPropagating) {
            piece.groupId = self.apos.util.generateId()
          }
        }
      },
      afterInsert: {
        async createRepeatItems(req, piece, options) {
          if (self._workflowPropagating) {
            // Workflow is replicating this but also its existing
            // scheduled repetitions, don't re-replicate them and cause problems
            return
          }
          if (piece.dateType === 'repeat' && piece.aposMode === 'draft') {
            await self.repeatEvent(req, piece, options)
            return
          } else {
            return
          }
        }
      },
      afterPublish: {
        async publishChildren(req, piece, options) {
          // If this is a repeating item, publish its children also
          if (piece.published.dateType === 'repeat' && piece.firstTime) {
            const existing = await self.findChildren(req, {
              groupId: piece.draft.groupId
            })
            for (const child of existing) {
              if (!child.isClone) continue // Skip the parent event
              await self.publish(req, child, options)
            }
          }
        }
      }
    }
  },
  methods(self, options) {
    return {
      denormalizeDatesAndTimes(piece) {
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
          startTime = '00:00:00'
          endTime = '23:59:59'
        }

        if (piece.dateType === 'repeat') {
          piece.hasClones = true
        }

        piece.start = new Date(startDate + ' ' + startTime)
        piece.end = new Date(enddate + ' ' + endTime)
      },
      async repeatEvent(req, piece, options) {
        let i
        let repeat = parseInt(piece.repeatCount) + 1
        let multiplier = piece.repeatInterval
        let addDates = []

        for (i = 1; i < repeat; i++) {
          addDates.push(dayjs(piece.startDate).add(i, multiplier).format('YYYY-MM-DD'))
        }

        let eventCopy
        for (const newDate of addDates) {
          eventCopy = { ...piece }
          eventCopy._id = null
          eventCopy.aposDocId = null
          eventCopy.isClone = true
          eventCopy.hasClones = false
          eventCopy.startDate = newDate
          eventCopy.endDate = newDate
          eventCopy.slug = eventCopy.slug + '-' + newDate
          eventCopy.dateType = 'single'
          self.denormalizeDatesAndTimes(eventCopy)
          await self.insert(req, eventCopy, options)
        }
        return
      },
      async findChildren(req, criteria) {
        const query = await self.find(req, criteria)
        const objArray = await query.toArray()
        return objArray
      }
    }
  },
  queries(self, query) {
    return {
      builders: {
        upcoming: {
          async finalize() {
            // Navigation by year, month or day should
            // trump this filter allowing you to
            // browse the past

            if (query.get('year')) {
              console.log('Year filter blocking')
              return;
            }
            if (query.get('month')) {
              return;
            }
            if (query.get('day')) {
              return;
            }
            if (query.get('start')) {
              return;
            }
            if (query.get('end')) {
              return;
            }

            if (query.get('upcoming')) {
              const queryTerm = query.get('upcoming')
              if (queryTerm) {
                query.and({
                  end: { $gt: new Date() }
                })
              } else {
                query.and({
                  end: { $lte: new Date() }
                })
              }
            }
          },
          launder(value) {
            return self.apos.launder.boolean(value)
          },
          choices() {
            return [
              { value: null, label: 'All' },
              { value: true, label: 'Upcoming' },
              { value: false, label: 'Past' }
            ]
          }
        },

        // Filter by year, in YYYY-MM-DD format. The event must
        // be taking place during that month (it might surround it).
        // Use of this filter cancels the upcoming filter
        year: {
          async finalize() {
            var year = query.get('year')
            console.log('Year filtering', year)
            if (year === null) {
              return
            }

            query.and({
              startDate: { $lte: year + '-12-31' },
              endDate: { $gte: year + '-01-01' }
            })
          },
          launder: function (s) {
            s = self.apos.launder.string(s)

            if (!s.match(/^\d\d\d\d$/)) {
              return null
            }

            return s
          },
          choices: function (callback) {
            return self.clone().upcoming(null).toDistinct('startDate', function (err, results) {
              if (err) {
                return callback(err)
              }
              return callback(null, _.uniq(_.each(results, function (value, key) {
                results[key] = value.substr(0, 4)
              })).sort().reverse())
            })
          }
        },

        /*
        // Filter by day, in YYYY-MM-DD format. The event must
        // be taking place during that month (it might surround it).
        // Use of this filter cancels the upcoming filter
        month: {
          async finalize() {
            var month = query.get('month');
   
            if (month === null) {
              return;
            }
   
            query.and({
              startDate: { $lte: month + '-31' },
              endDate: { $gte: month + '-01' }
            });
          },
          launder: function (s) {
            s = self.apos.launder.string(s);
   
            if (!s.match(/^\d\d\d\d-\d\d$/)) {
              return null;
            }
   
            return s;
          },
          choices: function (callback) {
            return self.clone().skip(0).limit(undefined).upcoming(null).projection({
              startDate: 1,
              endDate: 1,
              dateType: 1
            }).toArray(function (err, results) {
              if (err) {
                return callback(err);
              }
   
              var months = [];
   
              _.each(results, function (result) {
                if (!result.endDate || result.dateType === 'single' ||
                  result.startDate === result.endDate) {
                  months.push(result.startDate.substr(0, 7))
                  return
                }
   
                // Strategy credit to https://stackoverflow.com/a/43874192/888550
                var firstMoment = dayjs(result.startDate)
                var lastMoment = dayjs(result.endDate)
                var interim = firstMoment.clone()
   
                // Disabling rule because `interim` is modified by `.add()`.
                // eslint-disable-next-line no-unmodified-loop-condition
                while (lastMoment > interim ||
                  interim.format('M') === lastMoment.format('M')) {
                  months.push(interim.format('YYYY-MM'))
                  interim.add(1, 'month')
                }
              })
   
              months = _.uniq(months).sort().reverse()
   
              return callback(null, months)
            })
          }
        },
   
        // Filter by day, in YYYY-MM-DD format. The event must
        // be taking place during that day (it might surround it).
        // Use of this filter cancels the upcoming filter
        day: {
          finalize() {
            var day = query.get('day')
   
            if (day === null) {
              return
            }
   
            query.and({
              startDate: { $lte: day },
              endDate: { $gte: day }
            })
          },
          launder: function (s) {
            s = self.apos.launder.string(s)
   
            if (!s.match(fullDateRegex)) {
              return null
            }
   
            return s
          },
          choices: function (callback) {
            return self.clone().upcoming(null).toDistinct('startDate', function (err, results) {
              if (err) {
                return callback(err)
              }
              results.sort()
              results.reverse()
              return callback(null, results)
            })
          }
        },
   
        // Filter for events that are active after a certain date, in YYYY-MM-DD format.
        // The event must end on or after that day.
        // Use of this filter cancels the upcoming filter
        start: {
          finalize() {
            var start = query.get('start')
   
            if (start === null) {
              return
            }
   
            query.and({
              endDate: { $gte: start }
            })
          },
          launder: function (s) {
            s = self.apos.launder.string(s)
   
            if (!s.match(fullDateRegex)) {
              return null
            }
   
            return s
          }
        },
   
        // Filter for events that are active up until a certain day, in YYYY-MM-DD format.
        // The event must start on or before that day.
        // Use of this filter cancels the upcoming filter
        end: {
          finalize() {
            var end = query.get('end')
   
            if (end === null) {
              return
            }
   
            query.and({
              startDate: { $lte: end }
            })
          },
          launder: function (s) {
            s = self.apos.launder.string(s)
   
            if (!s.match(fullDateRegex)) {
              return null
            }
   
            return s
          }
        },
   
        */
        /*
        // Accepted for bc, wraps the date filter
        date: {
          finalize() {
            query.day(query.get('date'))
          },
          launder: function (s) {
            return self.apos.launder.string(s)
          }
        }
        */
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
