// Скрипт для начальной инициализации базы данных
// Можно запустить для создания базовых данных: node server/seed.js

require('dotenv').config();
const sequelize = require('./config/database');
const { User, Subject, Test, Question, University, Specialty } = require('./models');

const seed = async () => {
  try {
    await sequelize.authenticate();
    console.log('✓ Database connected');

    // Синхронизация моделей
    await sequelize.sync({ alter: false });
    console.log('✓ Models synchronized');

    // Создание или получение админ-пользователя
    // Проверяем по телефону (так как phone обязателен и уникален)
    let adminUser = await User.findOne({ where: { phone: '+996555000000' } });
    
    if (!adminUser) {
      // Если не найден по телефону, проверяем по email (для совместимости)
      adminUser = await User.findOne({ where: { email: 'admin@ort.test' } });
    }
    
    if (!adminUser) {
      // НЕ хешируем пароль вручную - модель User сделает это автоматически в хуке beforeCreate
      adminUser = await User.create({
        phone: '+996555000000', // Обязательное поле
        email: 'admin@ort.test', // Опциональное
        password: 'admin123', // Пароль будет автоматически захеширован в хуке beforeCreate
        firstName: 'Администратор',
        lastName: 'Системы',
        role: 'admin',
        isEmailVerified: true
      });
      console.log('✓ Created admin user:');
      console.log('  Phone: +996555000000');
      console.log('  Email: admin@ort.test');
      console.log('  Password: admin123');
    } else {
      // Обновляем роль на admin, если пользователь существует
      if (adminUser.role !== 'admin') {
        adminUser.role = 'admin';
        await adminUser.save();
        console.log('✓ Updated user role to admin');
      } else {
        console.log('✓ Admin user already exists');
      }
      console.log('  Phone:', adminUser.phone);
      console.log('  Email:', adminUser.email || 'не указан');
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

    // Создание основного ОРТ теста
    console.log('\n📝 Creating main ORT test...');
    const mainORTSubject = await Subject.findOne({ where: { name: 'Математика' } });
    if (mainORTSubject) {
      let mainORTTest = await Test.findOne({ where: { isMainORT: true } });
      
      if (!mainORTTest) {
        // Создаем основной ОРТ тест (комплексный тест по нескольким предметам)
        mainORTTest = await Test.create({
          subjectId: mainORTSubject.id,
          title: 'Основной ОРТ тест',
          description: 'Комплексный тест для определения общего балла ОРТ. Включает вопросы по математике, физике, химии, биологии, истории и другим предметам.',
          isFree: true,
          isMainORT: true,
          timeLimit: 180, // 3 часа
          maxScore: 300,
          createdBy: adminUser.id,
          isActive: true
        });

        // Создаем вопросы для основного ОРТ теста (примерные вопросы)
        const ortQuestions = [
          {
            questionText: 'Чему равно значение выражения 2² + 3²?',
            options: ['5', '13', '25', '36'],
            correctAnswer: 1,
            explanation: '2² = 4, 3² = 9, 4 + 9 = 13',
            points: 10
          },
          {
            questionText: 'Какая формула описывает площадь круга?',
            options: ['πr²', '2πr', 'πd', 'r²'],
            correctAnswer: 0,
            explanation: 'Площадь круга вычисляется по формуле πr², где r - радиус',
            points: 10
          },
          {
            questionText: 'Сколько будет 15% от 200?',
            options: ['15', '30', '25', '20'],
            correctAnswer: 1,
            explanation: '15% от 200 = 0.15 × 200 = 30',
            points: 10
          },
          {
            questionText: 'Какое число является простым?',
            options: ['4', '6', '7', '8'],
            correctAnswer: 2,
            explanation: 'Простое число делится только на 1 и само себя. 7 - простое число',
            points: 10
          },
          {
            questionText: 'Решите уравнение: 2x + 5 = 15',
            options: ['x = 5', 'x = 10', 'x = 7', 'x = 8'],
            correctAnswer: 0,
            explanation: '2x = 15 - 5, 2x = 10, x = 5',
            points: 10
          },
          {
            questionText: 'Что такое фотосинтез?',
            options: ['Процесс дыхания растений', 'Процесс образования органических веществ из неорганических под действием света', 'Процесс разложения органических веществ', 'Процесс поглощения воды'],
            correctAnswer: 1,
            explanation: 'Фотосинтез - это процесс образования органических веществ из углекислого газа и воды под действием солнечного света',
            points: 10
          },
          {
            questionText: 'Какая столица Кыргызстана?',
            options: ['Ош', 'Бишкек', 'Каракол', 'Джалал-Абад'],
            correctAnswer: 1,
            explanation: 'Столица Кыргызстана - Бишкек',
            points: 10
          },
          {
            questionText: 'В каком году Кыргызстан получил независимость?',
            options: ['1990', '1991', '1992', '1993'],
            correctAnswer: 1,
            explanation: 'Кыргызстан получил независимость 31 августа 1991 года',
            points: 10
          },
          {
            questionText: 'Какая формула описывает закон Ньютона F = ma?',
            options: ['Закон всемирного тяготения', 'Второй закон Ньютона', 'Третий закон Ньютона', 'Первый закон Ньютона'],
            correctAnswer: 1,
            explanation: 'F = ma - это второй закон Ньютона, где F - сила, m - масса, a - ускорение',
            points: 10
          },
          {
            questionText: 'Что такое валентность?',
            options: ['Количество электронов в атоме', 'Способность атома образовывать химические связи', 'Масса атома', 'Размер атома'],
            correctAnswer: 1,
            explanation: 'Валентность - это способность атома образовывать определенное количество химических связей',
            points: 10
          }
        ];

        for (const qData of ortQuestions) {
          await Question.create({
            testId: mainORTTest.id,
            questionText: qData.questionText,
            options: qData.options,
            correctAnswer: qData.correctAnswer,
            explanation: qData.explanation,
            points: qData.points,
            createdBy: adminUser.id
          });
        }

        console.log(`✓ Created main ORT test with ${ortQuestions.length} questions`);
      } else {
        console.log('✓ Main ORT test already exists');
      }
    }

    // Создание университетов и направлений
    console.log('\n🏛️ Creating universities and specialties...');
    
    const universitiesData = [
      {
        name: 'Кыргызский национальный университет имени Жусупа Баласагына',
        nameKg: 'Жусуп Баласагын атындагы Кыргыз улуттук университети',
        description: 'Ведущий университет Кыргызстана, основанный в 1925 году. Один из старейших и крупнейших вузов страны.',
        photo: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=800',
        address: 'г. Бишкек, ул. Чуй, 547',
        website: 'https://www.knu.kg',
        phone: '+996 (312) 32-23-45',
        email: 'info@knu.kg',
        specialties: [
          {
            name: 'Математика и информатика',
            averageScore: 180,
            minScore: 160,
            duration: 4,
            description: 'Подготовка специалистов в области математики, программирования и информационных технологий'
          },
          {
            name: 'Физика',
            averageScore: 175,
            minScore: 155,
            duration: 4,
            description: 'Изучение физических законов и явлений, подготовка физиков-исследователей'
          },
          {
            name: 'Химия',
            averageScore: 170,
            minScore: 150,
            duration: 4,
            description: 'Подготовка химиков для работы в научных и промышленных лабораториях'
          },
          {
            name: 'Биология',
            averageScore: 165,
            minScore: 145,
            duration: 4,
            description: 'Изучение живых организмов и их взаимодействия с окружающей средой'
          },
          {
            name: 'Экономика',
            averageScore: 185,
            minScore: 165,
            duration: 4,
            description: 'Подготовка экономистов для работы в банках, компаниях и государственных структурах'
          }
        ]
      },
      {
        name: 'Кыргызский государственный технический университет имени И. Раззакова',
        nameKg: 'И. Раззаков атындагы Кыргыз мамлекеттик техникалык университети',
        description: 'Крупнейший технический университет Кыргызстана, готовящий инженеров различных специальностей.',
        photo: 'https://images.unsplash.com/photo-1516321318423-f06f85b50444?w=800',
        address: 'г. Бишкек, пр. Чуй, 66',
        website: 'https://www.kstu.kg',
        phone: '+996 (312) 54-32-10',
        email: 'info@kstu.kg',
        specialties: [
          {
            name: 'Информационные технологии',
            averageScore: 190,
            minScore: 170,
            duration: 4,
            description: 'Подготовка IT-специалистов: программистов, системных администраторов, веб-разработчиков'
          },
          {
            name: 'Строительство',
            averageScore: 175,
            minScore: 155,
            duration: 4,
            description: 'Подготовка инженеров-строителей для проектирования и строительства зданий и сооружений'
          },
          {
            name: 'Электротехника',
            averageScore: 180,
            minScore: 160,
            duration: 4,
            description: 'Подготовка инженеров-электриков для работы с электрооборудованием и энергосистемами'
          },
          {
            name: 'Машиностроение',
            averageScore: 170,
            minScore: 150,
            duration: 4,
            description: 'Подготовка инженеров-механиков для проектирования и производства машин и механизмов'
          },
          {
            name: 'Архитектура',
            averageScore: 195,
            minScore: 175,
            duration: 5,
            description: 'Подготовка архитекторов для проектирования зданий и градостроительства'
          }
        ]
      }
    ];

    for (const uniData of universitiesData) {
      let university = await University.findOne({ where: { name: uniData.name } });
      
      if (!university) {
        university = await University.create({
          name: uniData.name,
          nameKg: uniData.nameKg,
          description: uniData.description,
          photo: uniData.photo,
          address: uniData.address,
          website: uniData.website,
          phone: uniData.phone,
          email: uniData.email,
          createdBy: adminUser.id
        });
        console.log(`✓ Created university: ${university.name}`);

        // Создаем направления
        for (const specData of uniData.specialties) {
          await Specialty.create({
            universityId: university.id,
            name: specData.name,
            description: specData.description,
            averageScore: specData.averageScore,
            minScore: specData.minScore,
            duration: specData.duration,
            degree: 'bachelor',
            createdBy: adminUser.id
          });
        }
        console.log(`  ✓ Added ${uniData.specialties.length} specialties`);
      } else {
        console.log(`✓ University already exists: ${university.name}`);
      }
    }

    console.log('\n✓ Seed completed successfully!');
    console.log('\nAdmin credentials:');
    console.log('  Phone: +996555000000');
    console.log('  Email: admin@ort.test');
    console.log('  Password: admin123');
    console.log('\nYou can now:');
    console.log('  1. Login as admin');
    console.log('  2. Create more tests and questions');
    console.log('  3. Add more subjects if needed');
    console.log('  4. Add more universities and specialties');
    console.log('  5. View universities at /universities');
    
    process.exit(0);
  } catch (error) {
    console.error('✗ Seed error:', error);
    process.exit(1);
  }
};

seed();
