// modules/event-widget/index.js
module.exports = {
    extend: '@apostrophecms/widget-type',
    options: {
        label: 'Events listing'
    },
    // 👇 The widget type's field schema
    fields: {
        add: {
            // 👇 The first column area
            eventTags: {
                label: 'Event tags',
                type: 'array',
                fields: {
                    add: {
                        name: {
                            type: 'string',
                            label: 'Name'
                        }
                    }
                }
            }
        }
    }
};

