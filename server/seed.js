// Скрипт для начальной инициализации базы данных
// Можно запустить для создания базовых данных: node server/seed.js

require('dotenv').config();
const sequelize = require('./config/database');
const { User, Subject, Test, Question } = require('./models');
const bcrypt = require('bcryptjs');

const seed = async () => {
  try {
    await sequelize.authenticate();
    console.log('✓ Database connected');

    // Синхронизация моделей
    await sequelize.sync({ alter: false });
    console.log('✓ Models synchronized');

    // Создание или получение админ-пользователя
    let adminUser = await User.findOne({ where: { email: 'admin@ort.test' } });
    
    if (!adminUser) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      adminUser = await User.create({
        email: 'admin@ort.test',
        password: hashedPassword,
        firstName: 'Администратор',
        lastName: 'Системы',
        role: 'admin',
        isEmailVerified: true
      });
      console.log('✓ Created admin user: admin@ort.test / admin123');
    } else {
      console.log('✓ Admin user already exists');
    }

    // Создание базовых предметов
    const subjectsData = [
      { name: 'Математика', nameKg: 'Математика', description: 'Тесты по математике' },
      { name: 'Русский язык', nameKg: 'Орус тили', description: 'Тесты по русскому языку' },
      { name: 'Английский язык', nameKg: 'Англис тили', description: 'Тесты по английскому языку' },
      { name: 'История', nameKg: 'Тарых', description: 'Тесты по истории' },
      { name: 'Естествознание', nameKg: 'Табигый билим', description: 'Тесты по естествознанию' }
    ];

    const subjects = [];
    for (const subjectData of subjectsData) {
      const [subject, created] = await Subject.findOrCreate({
        where: { name: subjectData.name },
        defaults: subjectData
      });
      subjects.push(subject);
      if (created) {
        console.log(`✓ Created subject: ${subject.name}`);
      }
    }

    // Создание бесплатных тестов по каждому предмету
    const testTemplates = {
      'Математика': {
        title: 'Вводный тест по математике',
        description: 'Базовые вопросы по алгебре и геометрии для подготовки к ОРТ',
        questions: [
          {
            questionText: 'Чему равно 2 + 2?',
            options: [
              { text: '3' },
              { text: '4' },
              { text: '5' },
              { text: '6' }
            ],
            correctAnswer: 1,
            explanation: 'Сложение: 2 + 2 = 4'
          },
          {
            questionText: 'Чему равно 5 × 3?',
            options: [
              { text: '10' },
              { text: '15' },
              { text: '20' },
              { text: '25' }
            ],
            correctAnswer: 1,
            explanation: 'Умножение: 5 × 3 = 15'
          },
          {
            questionText: 'Что такое площадь квадрата со стороной 5?',
            options: [
              { text: '10' },
              { text: '20' },
              { text: '25' },
              { text: '30' }
            ],
            correctAnswer: 2,
            explanation: 'Площадь квадрата = сторона² = 5² = 25'
          }
        ]
      },
      'Русский язык': {
        title: 'Вводный тест по русскому языку',
        description: 'Проверка знаний по орфографии и пунктуации',
        questions: [
          {
            questionText: 'Выберите правильный вариант: "Я (что) делаю?"',
            options: [
              { text: 'что' },
              { text: 'что-то' },
              { text: 'ничего' },
              { text: 'чтото' }
            ],
            correctAnswer: 1,
            explanation: 'Правильно писать через дефис: что-то'
          },
          {
            questionText: 'Где нужно поставить запятую? "Он пришел(,) когда все уже ушли"',
            options: [
              { text: 'Запятая не нужна' },
              { text: 'После "пришел"' },
              { text: 'После "когда"' },
              { text: 'После "уже"' }
            ],
            correctAnswer: 1,
            explanation: 'В сложноподчиненном предложении нужна запятая перед союзом "когда"'
          }
        ]
      },
      'Английский язык': {
        title: 'Вводный тест по английскому языку',
        description: 'Базовые вопросы по грамматике и лексике',
        questions: [
          {
            questionText: 'Choose the correct form: "I ___ to school every day"',
            options: [
              { text: 'go' },
              { text: 'goes' },
              { text: 'went' },
              { text: 'going' }
            ],
            correctAnswer: 0,
            explanation: 'Present Simple: I go, he/she goes'
          },
          {
            questionText: 'What is the past tense of "go"?',
            options: [
              { text: 'goed' },
              { text: 'went' },
              { text: 'goes' },
              { text: 'gone' }
            ],
            correctAnswer: 1,
            explanation: 'Неправильный глагол: go - went - gone'
          }
        ]
      },
      'История': {
        title: 'Вводный тест по истории',
        description: 'Основные вопросы по истории Кыргызстана и мира',
        questions: [
          {
            questionText: 'В каком году Кыргызстан получил независимость?',
            options: [
              { text: '1990' },
              { text: '1991' },
              { text: '1992' },
              { text: '1993' }
            ],
            correctAnswer: 1,
            explanation: 'Кыргызстан получил независимость 31 августа 1991 года'
          }
        ]
      },
      'Естествознание': {
        title: 'Вводный тест по естествознанию',
        description: 'Базовые вопросы по физике, химии и биологии',
        questions: [
          {
            questionText: 'Сколько планет в Солнечной системе?',
            options: [
              { text: '7' },
              { text: '8' },
              { text: '9' },
              { text: '10' }
            ],
            correctAnswer: 1,
            explanation: 'В Солнечной системе 8 планет (Плутон исключен из списка планет в 2006 году)'
          },
          {
            questionText: 'Какая формула воды?',
            options: [
              { text: 'H2O' },
              { text: 'CO2' },
              { text: 'O2' },
              { text: 'H2SO4' }
            ],
            correctAnswer: 0,
            explanation: 'Вода имеет химическую формулу H2O - два атома водорода и один кислорода'
          }
        ]
      }
    };

    for (const subject of subjects) {
      // Проверяем, есть ли уже бесплатный тест для этого предмета
      let freeTest = await Test.findOne({
        where: {
          subjectId: subject.id,
          isFree: true,
          isActive: true
        }
      });

      if (!freeTest) {
        const template = testTemplates[subject.name];
        if (template) {
          // Создаем тест
          freeTest = await Test.create({
            subjectId: subject.id,
            title: template.title,
            description: template.description,
            isFree: true,
            timeLimit: 15, // 15 минут
            maxScore: template.questions.length * 10,
            createdBy: adminUser.id,
            isActive: true
          });

          console.log(`✓ Created free test: ${freeTest.title} (${subject.name})`);

          // Создаем вопросы для теста
          for (let i = 0; i < template.questions.length; i++) {
            const qTemplate = template.questions[i];
            await Question.create({
              testId: freeTest.id,
              questionText: qTemplate.questionText,
              options: qTemplate.options,
              correctAnswer: qTemplate.correctAnswer,
              explanation: qTemplate.explanation || '',
              points: 10,
              createdBy: adminUser.id
            });
          }

          console.log(`  ✓ Added ${template.questions.length} questions`);
        } else {
          console.log(`  ⚠ No template for subject: ${subject.name}`);
        }
      } else {
        console.log(`✓ Free test already exists for: ${subject.name}`);
      }
    }

    console.log('\n✓ Seed completed successfully!');
    console.log('\nAdmin credentials:');
    console.log('  Email: admin@ort.test');
    console.log('  Password: admin123');
    console.log('\nYou can now:');
    console.log('  1. Login as admin');
    console.log('  2. Create more tests and questions');
    console.log('  3. Add more subjects if needed');
    
    process.exit(0);
  } catch (error) {
    console.error('✗ Seed error:', error);
    process.exit(1);
  }
};

seed();
