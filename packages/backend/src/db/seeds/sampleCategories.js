require('dotenv').config();

const mongoose = require('mongoose');
const { Category } = require('../../models/forumModel');

const sampleCategories = [
    {
        name: 'General Discussion',
        description: 'Talk about anything and everything.',
        color: '#3B82F6',
        icon: 'ChatBubbleLeftEllipsisIcon',
        order: 1,
        isActive: true
    },
    {
        name: 'Announcements',
        description: 'Official news and updates.',
        color: '#F59E42',
        icon: 'SpeakerphoneIcon',
        order: 2,
        isActive: true
    },
    {
        name: 'Help & Support',
        description: 'Get help and support from the community.',
        color: '#10B981',
        icon: 'LifebuoyIcon',
        order: 3,
        isActive: true
    },
    {
        name: 'Feedback',
        description: 'Share your feedback and suggestions.',
        color: '#F43F5E',
        icon: 'LightBulbIcon',
        order: 4,
        isActive: true
    }
];

const seedCategories = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        for (const cat of sampleCategories) {
            const exists = await Category.findOne({ name: cat.name });
            if (!exists) {
                await Category.create(cat);
                console.log(`Created category: ${cat.name}`);
            } else {
                console.log(`Category already exists: ${cat.name}`);
            }
        }
        console.log('Sample categories seeded successfully');
        await mongoose.disconnect();
    } catch (error) {
        console.error('Error seeding categories:', error);
        process.exit(1);
    }
};

if (require.main === module) {
    seedCategories();
}

module.exports = { seedCategories };
