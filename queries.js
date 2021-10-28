module.exports = (self, query) => {
    return {
      builders: {
        upcoming: {
          async finalize() {
            // Navigation by year, month or day should
            // trump this filter allowing you to
            // browse the past

            const upcoming = query.get('upcoming')

            if (upcoming === null) {
              return
            }

            if (upcoming) {
              query.and({
                end: { $gt: new Date() }
              })
            } else {
              query.and({
                end: { $lte: new Date() }
              })
            }
          },
          launder(value) {
            return self.apos.launder.booleanOrNull(value)
          },
          choices() {
            return [
              { value: null, label: 'Both' },
              { value: true, label: 'Upcoming' },
              { value: false, label: 'Past' }
            ]
          }
        }
      }
    }
  }