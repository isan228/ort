const sequelize = require('../config/database');

const User = require('./User');
const Subscription = require('./Subscription');
const Subject = require('./Subject');
const Test = require('./Test');
const Question = require('./Question');
const TestResult = require('./TestResult');
const MonthlyRanking = require('./MonthlyRanking');
const University = require('./University');
const Specialty = require('./Specialty');

// Associations
User.hasMany(Subscription, { foreignKey: 'userId', as: 'subscriptions' });
Subscription.belongsTo(User, { foreignKey: 'userId', as: 'user' });

Subject.hasMany(Test, { foreignKey: 'subjectId', as: 'tests' });
Test.belongsTo(Subject, { foreignKey: 'subjectId', as: 'subject' });

Test.hasMany(Question, { foreignKey: 'testId', as: 'questions' });
Question.belongsTo(Test, { foreignKey: 'testId', as: 'test' });

User.hasMany(Test, { foreignKey: 'createdBy', as: 'createdTests' });
Test.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });

User.hasMany(Question, { foreignKey: 'createdBy', as: 'createdQuestions' });
Question.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });

User.hasMany(TestResult, { foreignKey: 'userId', as: 'testResults' });
TestResult.belongsTo(User, { foreignKey: 'userId', as: 'user' });

Test.hasMany(TestResult, { foreignKey: 'testId', as: 'results' });
TestResult.belongsTo(Test, { foreignKey: 'testId', as: 'test' });

// Referral associations
User.hasMany(User, { foreignKey: 'referredBy', as: 'referrals' });
User.belongsTo(User, { foreignKey: 'referredBy', as: 'referrer' });

// MonthlyRanking associations
User.hasMany(MonthlyRanking, { foreignKey: 'userId', as: 'monthlyRankings' });
MonthlyRanking.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// University associations
User.hasMany(University, { foreignKey: 'createdBy', as: 'createdUniversities' });
University.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });

University.hasMany(Specialty, { foreignKey: 'universityId', as: 'specialties' });
Specialty.belongsTo(University, { foreignKey: 'universityId', as: 'university' });

User.hasMany(Specialty, { foreignKey: 'createdBy', as: 'createdSpecialties' });
Specialty.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });

module.exports = {
  sequelize,
  User,
  Subscription,
  Subject,
  Test,
  Question,
  TestResult,
  MonthlyRanking,
  University,
  Specialty
};
