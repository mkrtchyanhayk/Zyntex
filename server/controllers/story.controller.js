import Story from '../models/Story.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import AudioLibrary from '../models/AudioLibrary.js';
import FilterEffect from '../models/FilterEffect.js';

// Create story with all features
export const createStory = async (req, res) => {
    try {
        const {
            caption, mediaType, mentions, poll, question, quiz, countdown, slider,
            music, gifs, filter, location, hashtags, link
        } = req.body;
        const mediaUrl = req.file ? `/uploads/${req.file.filename}` : '';

        if (!mediaUrl) {
            return res.status(400).json({ message: 'Media file required' });
        }

        // Set expiration to 24 hours from now
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 24);

        // Parse JSON fields
        const parsedMentions = mentions ? JSON.parse(mentions) : [];
        const parsedPoll = poll ? JSON.parse(poll) : null;
        const parsedQuestion = question ? JSON.parse(question) : null;
        const parsedQuiz = quiz ? JSON.parse(quiz) : null;
        const parsedCountdown = countdown ? JSON.parse(countdown) : null;
        const parsedSlider = slider ? JSON.parse(slider) : null;
        const parsedMusic = music ? JSON.parse(music) : null;
        const parsedGifs = gifs ? JSON.parse(gifs) : [];
        const parsedFilter = filter ? JSON.parse(filter) : null;
        const parsedLocation = location ? JSON.parse(location) : null;
        const parsedHashtags = hashtags ? JSON.parse(hashtags) : [];
        const parsedLink = link ? JSON.parse(link) : null;

        const story = await Story.create({
            author: req.userId,
            mediaUrl,
            mediaType: mediaType || 'image',
            caption: caption || '',
            mentions: parsedMentions,
            poll: parsedPoll,
            question: parsedQuestion,
            quiz: parsedQuiz,
            countdown: parsedCountdown,
            slider: parsedSlider,
            music: parsedMusic,
            gifs: parsedGifs,
            filter: parsedFilter,
            location: parsedLocation,
            hashtags: parsedHashtags,
            link: parsedLink,
            expiresAt
        });

        const populated = await story.populate('author', 'username displayName avatarUrl');

        // Notify mentioned users
        if (parsedMentions && parsedMentions.length > 0) {
            const mentioner = await User.findById(req.userId).select('username');
            for (const mention of parsedMentions) {
                if (mention.user && mention.user.toString() !== req.userId) {
                    await Notification.create({
                        user: mention.user,
                        title: 'Story Mention',
                        body: `${mentioner.username} mentioned you in their story`,
                        link: `/stories/${req.userId}`
                    });
                }
            }
        }

        // Update music usage count
        if (parsedMusic && parsedMusic.trackName) {
            await AudioLibrary.updateOne(
                { trackName: parsedMusic.trackName },
                { $inc: { usageCount: 1 } }
            );
        }

        // Update filter usage count
        if (parsedFilter && parsedFilter.name) {
            await FilterEffect.updateOne(
                { name: parsedFilter.name },
                { $inc: { usageCount: 1 } }
            );
        }

        res.status(201).json(populated);
    } catch (err) {
        res.status(500).json({ message: 'Failed to create story', error: err.message });
    }
};

// Get stories feed
export const getStoriesFeed = async (req, res) => {
    try {
        const user = await User.findById(req.userId).select('following');
        const followingIds = user.following || [];

        // Get active stories from users we follow + our own
        const stories = await Story.find({
            author: { $in: [...followingIds, req.userId] },
            expiresAt: { $gt: new Date() }
        })
            .populate('author', 'username displayName avatarUrl')
            .sort({ createdAt: -1 });

        // Group stories by author
        const groupedStories = stories.reduce((acc, story) => {
            const authorId = story.author._id.toString();
            if (!acc[authorId]) {
                acc[authorId] = {
                    author: story.author,
                    stories: [],
                    hasViewed: story.viewers.some(v => v.user.toString() === req.userId)
                };
            }
            acc[authorId].stories.push(story);
            return acc;
        }, {});

        res.json(Object.values(groupedStories));
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch stories', error: err.message });
    }
};

// Get user stories
export const getUserStories = async (req, res) => {
    try {
        const { username } = req.params;
        const user = await User.findOne({ username });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const stories = await Story.find({
            author: user._id,
            expiresAt: { $gt: new Date() }
        })
            .populate('author', 'username displayName avatarUrl')
            .sort({ createdAt: 1 });

        res.json(stories);
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch user stories', error: err.message });
    }
};

// View story
export const viewStory = async (req, res) => {
    try {
        const { id } = req.params;
        const story = await Story.findById(id);

        if (!story) {
            return res.status(404).json({ message: 'Story not found' });
        }

        // Check if already viewed
        const alreadyViewed = story.viewers.some(v => v.user.toString() === req.userId);

        if (!alreadyViewed) {
            story.viewers.push({ user: req.userId, viewedAt: new Date() });
            await story.save();

            // Notify story author
            if (story.author.toString() !== req.userId) {
                const viewer = await User.findById(req.userId).select('username');
                await Notification.create({
                    user: story.author,
                    title: 'Story View',
                    body: `${viewer.username} viewed your story`,
                    link: `/stories/${story.author}`
                });
            }
        }

        res.json({ success: true, viewCount: story.viewers.length });
    } catch (err) {
        res.status(500).json({ message: 'Failed to view story', error: err.message });
    }
};

// Delete story
export const deleteStory = async (req, res) => {
    try {
        const { id } = req.params;
        const story = await Story.findById(id);

        if (!story) {
            return res.status(404).json({ message: 'Story not found' });
        }

        if (story.author.toString() !== req.userId) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        await story.deleteOne();
        res.json({ message: 'Story deleted' });
    } catch (err) {
        res.status(500).json({ message: 'Failed to delete story', error: err.message });
    }
};

// Get story viewers
export const getStoryViewers = async (req, res) => {
    try {
        const { id } = req.params;
        const story = await Story.findById(id).populate('viewers.user', 'username displayName avatarUrl');

        if (!story) {
            return res.status(404).json({ message: 'Story not found' });
        }

        if (story.author.toString() !== req.userId) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        res.json(story.viewers);
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch viewers', error: err.message });
    }
};

// Poll interaction
export const voteOnPoll = async (req, res) => {
    try {
        const { id, optionIndex } = req.body;
        const story = await Story.findById(id);

        if (!story || !story.poll) {
            return res.status(404).json({ message: 'Poll not found' });
        }

        // Remove previous vote if exists
        story.poll.options.forEach(opt => {
            opt.votes = opt.votes.filter(userId => userId.toString() !== req.userId);
        });

        // Add new vote
        if (!story.poll.options[optionIndex].votes.includes(req.userId)) {
            story.poll.options[optionIndex].votes.push(req.userId);
        }

        await story.save();

        // Notify story author
        if (story.author.toString() !== req.userId) {
            const voter = await User.findById(req.userId).select('username');
            await Notification.create({
                user: story.author,
                title: 'Poll Vote',
                body: `${voter.username} voted on your poll`,
                link: `/stories/${story.author}`
            });
        }

        res.json(story.poll);
    } catch (err) {
        res.status(500).json({ message: 'Failed to vote', error: err.message });
    }
};

// Question response
export const answerQuestion = async (req, res) => {
    try {
        const { id, answer } = req.body;
        const story = await Story.findById(id);

        if (!story || !story.question) {
            return res.status(404).json({ message: 'Question not found' });
        }

        story.question.responses.push({
            user: req.userId,
            answer,
            timestamp: new Date()
        });

        await story.save();

        // Notify story author
        if (story.author.toString() !== req.userId) {
            const responder = await User.findById(req.userId).select('username');
            await Notification.create({
                user: story.author,
                title: 'Question Response',
                body: `${responder.username} answered your question`,
                link: `/stories/${story.author}`
            });
        }

        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ message: 'Failed to answer', error: err.message });
    }
};

// Quiz interaction
export const answerQuiz = async (req, res) => {
    try {
        const { id, optionIndex } = req.body;
        const story = await Story.findById(id);

        if (!story || !story.quiz) {
            return res.status(404).json({ message: 'Quiz not found' });
        }

        const option = story.quiz.options[optionIndex];
        if (!option.votes.includes(req.userId)) {
            option.votes.push(req.userId);
        }

        await story.save();

        res.json({
            correct: option.isCorrect,
            quiz: story.quiz
        });
    } catch (err) {
        res.status(500).json({ message: 'Failed to answer quiz', error: err.message });
    }
};

// Countdown subscription
export const subscribeCountdown = async (req, res) => {
    try {
        const { id } = req.params;
        const story = await Story.findById(id);

        if (!story || !story.countdown) {
            return res.status(404).json({ message: 'Countdown not found' });
        }

        if (!story.countdown.subscribers.includes(req.userId)) {
            story.countdown.subscribers.push(req.userId);
            await story.save();
        }

        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ message: 'Failed to subscribe', error: err.message });
    }
};

// Slider response
export const respondToSlider = async (req, res) => {
    try {
        const { id, value } = req.body;
        const story = await Story.findById(id);

        if (!story || !story.slider) {
            return res.status(404).json({ message: 'Slider not found' });
        }

        // Remove previous response
        story.slider.responses = story.slider.responses.filter(
            r => r.user.toString() !== req.userId
        );

        // Add new response
        story.slider.responses.push({
            user: req.userId,
            value: Math.max(0, Math.min(100, value))
        });

        await story.save();
        res.json(story.slider);
    } catch (err) {
        res.status(500).json({ message: 'Failed to respond', error: err.message });
    }
};

// Report screenshot
export const reportScreenshot = async (req, res) => {
    try {
        const { id } = req.params;
        const story = await Story.findById(id);

        if (!story) {
            return res.status(404).json({ message: 'Story not found' });
        }

        story.screenshots.push({
            user: req.userId,
            timestamp: new Date()
        });

        await story.save();

        // Notify story author
        if (story.author.toString() !== req.userId) {
            const user = await User.findById(req.userId).select('username');
            await Notification.create({
                user: story.author,
                title: 'Story Screenshot',
                body: `${user.username} took a screenshot of your story`,
                link: `/stories/${story.author}`
            });
        }

        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ message: 'Failed to report screenshot', error: err.message });
    }
};

// Get question responses (for story author)
export const getQuestionResponses = async (req, res) => {
    try {
        const { id } = req.params;
        const story = await Story.findById(id)
            .populate('question.responses.user', 'username displayName avatarUrl');

        if (!story || !story.question) {
            return res.status(404).json({ message: 'Question not found' });
        }

        if (story.author.toString() !== req.userId) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        res.json(story.question.responses);
    } catch (err) {
        res.status(500).json({ message: 'Failed to get responses', error: err.message });
    }
};
