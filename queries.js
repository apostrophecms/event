module.exports = (self, query) => {
  return {
    builders: {
      upcoming: {
        def: true,
        async finalize() {
          // Navigation by year, month or day should
          // trump this filter allowing you to
          // browse the past

          const upcoming = query.get("upcoming");

          if (upcoming === null) {
            return;
          }

          if (upcoming) {
            query.and({
              end: { $gt: new Date() },
            });
          } else {
            query.and({
              end: { $lte: new Date() },
            });
          }
        },
        launder(value) {
          return self.apos.launder.booleanOrNull(value);
        },
        choices() {
          return [
            { value: null, label: "Both" },
            { value: true, label: "Upcoming" },
            { value: false, label: "Past" },
          ];
        },
      },
      // Filter by year, in YYYY-MM-DD format. The event must
      // be taking place during that month (it might surround it).
      // be taking place during that year (it might surround it).
      // Use of this filter cancels the upcoming filter
      year: {
        def: null,
        async finalize() {
          const year = query.get("year");
          if (!year) {
            return;
          }
          console.log("Year filtering", year);

          query.and({
            startDate: { $lte: year + "-12-31" },
          });
        },
        async choices() {
          const alldates = await query
            .clone()
            .upcoming(null)
            .toDistinct("startDate");

          const years = [{ value: null, label: "All" }];
          for (const eachdate of alldates) {
            const year = eachdate.substr(0, 4);
            if (!years.find((e) => e.value === year)) {
              years.push({ value: year, label: year });
            }
            years.sort().reverse();
          }
          return years;
        },
      },
      /*
          // Filter by day, in YYYY-MM-DD format. The event must
          // be taking place during that month (it might surround it).
          // Use of this filter cancels the upcoming filter
          month: {
            async finalize() {
              var month = query.get('month');
     
              const month = query.get('month')
    
              if (month === null) {
                return;
              }
     
    
              query.and({
                startDate: { $lte: month + '-31' },
                endDate: { $gte: month + '-01' }
              });
              })
            },
            launder: function (s) {
              s = self.apos.launder.string(s);
     
              s = self.apos.launder.string(s)
    
              if (!s.match(/^\d\d\d\d-\d\d$/)) {
                return null;
                return null
              }
     
              return s;
    
              return s
            },
            */
    },
  };
};
