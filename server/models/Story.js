import mongoose from 'mongoose';

const StorySchema = new mongoose.Schema({
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    mediaUrl: {
        type: String,
        required: true
    },
    mediaType: {
        type: String,
        enum: ['image', 'video'],
        default: 'image'
    },
    caption: {
        type: String,
        default: ''
    },

    // Story mentions
    mentions: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        coordinates: {
            x: { type: Number, min: 0, max: 100 },
            y: { type: Number, min: 0, max: 100 }
        }
    }],

    // Interactive stickers
    poll: {
        question: String,
        options: [{
            text: String,
            votes: [{
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User'
            }]
        }],
        coordinates: {
            x: { type: Number, min: 0, max: 100 },
            y: { type: Number, min: 0, max: 100 }
        }
    },

    question: {
        text: String,
        responses: [{
            user: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User'
            },
            answer: String,
            timestamp: {
                type: Date,
                default: Date.now
            }
        }],
        coordinates: {
            x: { type: Number, min: 0, max: 100 },
            y: { type: Number, min: 0, max: 100 }
        }
    },

    quiz: {
        question: String,
        options: [{
            text: String,
            isCorrect: Boolean,
            votes: [{
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User'
            }]
        }],
        coordinates: {
            x: { type: Number, min: 0, max: 100 },
            y: { type: Number, min: 0, max: 100 }
        }
    },

    countdown: {
        text: String,
        endTime: Date,
        subscribers: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }],
        coordinates: {
            x: { type: Number, min: 0, max: 100 },
            y: { type: Number, min: 0, max: 100 }
        }
    },

    slider: {
        question: String,
        emoji: {
            type: String,
            default: '😍'
        },
        responses: [{
            user: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User'
            },
            value: {
                type: Number,
                min: 0,
                max: 100
            }
        }],
        coordinates: {
            x: { type: Number, min: 0, max: 100 },
            y: { type: Number, min: 0, max: 100 }
        }
    },

    // Music
    music: {
        trackName: String,
        artistName: String,
        albumCover: String,
        audioUrl: String,
        startTime: Number, // seconds
        duration: Number // seconds
    },

    // GIFs
    gifs: [{
        url: String,
        coordinates: {
            x: { type: Number, min: 0, max: 100 },
            y: { type: Number, min: 0, max: 100 }
        },
        size: {
            width: Number,
            height: Number
        }
    }],

    // Filters/Effects
    filter: {
        name: String,
        intensity: {
            type: Number,
            min: 0,
            max: 100,
            default: 100
        }
    },

    // Location
    location: {
        name: String,
        latitude: Number,
        longitude: Number,
        coordinates: {
            x: { type: Number, min: 0, max: 100 },
            y: { type: Number, min: 0, max: 100 }
        }
    },

    // Hashtags
    hashtags: [{
        tag: String,
        coordinates: {
            x: { type: Number, min: 0, max: 100 },
            y: { type: Number, min: 0, max: 100 }
        }
    }],

    // Link (Swipe Up)
    link: {
        url: String,
        text: {
            type: String,
            default: 'See more'
        }
    },

    viewers: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        viewedAt: {
            type: Date,
            default: Date.now
        }
    }],

    // Screenshot detection
    screenshots: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        timestamp: {
            type: Date,
            default: Date.now
        }
    }],

    expiresAt: {
        type: Date,
        required: true,
        index: true
    },
    createdAt: {
        type: Date,
        default: Date.now,
        index: true
    }
});

// Indexes for efficient querying
StorySchema.index({ author: 1, expiresAt: 1 });
StorySchema.index({ createdAt: -1 });
StorySchema.index({ 'mentions.user': 1 });

// Virtual for checking if story is expired
StorySchema.virtual('isExpired').get(function () {
    return new Date() > this.expiresAt;
});

export default mongoose.model('Story', StorySchema);
