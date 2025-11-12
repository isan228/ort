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

    // Создание нескольких админ-пользователей
    const adminsData = [
      {
        phone: '+996555000000',
        email: 'admin@ort.test',
        password: 'admin123',
        firstName: 'Главный',
        lastName: 'Администратор',
        role: 'admin'
      },
      {
        phone: '+996555000001',
        email: 'admin2@ort.test',
        password: 'admin123',
        firstName: 'Второй',
        lastName: 'Администратор',
        role: 'admin'
      },
      {
        phone: '+996555000002',
        email: 'admin3@ort.test',
        password: 'admin123',
        firstName: 'Третий',
        lastName: 'Администратор',
        role: 'admin'
      }
    ];

    const adminUsers = [];
    for (const adminData of adminsData) {
      // Сначала проверяем по телефону
      let adminUser = await User.findOne({ where: { phone: adminData.phone } });
      
      // Если не найден по телефону, проверяем по email
      if (!adminUser && adminData.email) {
        adminUser = await User.findOne({ where: { email: adminData.email } });
      }
      
      if (!adminUser) {
        // Создаем нового админа
        adminUser = await User.create({
          phone: adminData.phone,
          email: adminData.email,
          password: adminData.password,
          firstName: adminData.firstName,
          lastName: adminData.lastName,
          role: adminData.role,
          isEmailVerified: true
        });
        console.log(`✓ Created admin user: ${adminData.firstName} ${adminData.lastName}`);
        console.log(`  Phone: ${adminData.phone}`);
        console.log(`  Email: ${adminData.email}`);
        console.log(`  Password: ${adminData.password}`);
      } else {
        // Обновляем существующего пользователя (но не меняем email если он уже есть и отличается)
        let updated = false;
        if (adminUser.role !== 'admin') {
          adminUser.role = 'admin';
          updated = true;
        }
        // Не обновляем телефон, если пользователь уже существует с другим телефоном
        // Не обновляем email, если он уже есть (чтобы избежать конфликтов уникальности)
        if (adminUser.firstName !== adminData.firstName) {
          adminUser.firstName = adminData.firstName;
          updated = true;
        }
        if (adminUser.lastName !== adminData.lastName) {
          adminUser.lastName = adminData.lastName;
          updated = true;
        }
        if (updated) {
          await adminUser.save();
          console.log(`✓ Updated admin user: ${adminUser.firstName} ${adminUser.lastName} (${adminUser.phone})`);
        } else {
          console.log(`✓ Admin user already exists: ${adminUser.phone}`);
        }
      }
      adminUsers.push(adminUser);
    }

    // Используем первого админа как основного для создания контента
    const adminUser = adminUsers[0];

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

    // Создание бесплатных и платных тестов
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
          // Создаем бесплатный тест
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

      // Создаем платные тесты для каждого предмета
      const paidTestTitles = [
        `Продвинутый тест по ${subject.name}`,
        `Углубленный курс по ${subject.name}`,
        `Подготовка к ОРТ: ${subject.name}`,
        `Экзаменационный тест: ${subject.name}`
      ];

      for (let i = 0; i < paidTestTitles.length; i++) {
        const testTitle = paidTestTitles[i];
        let paidTest = await Test.findOne({
          where: {
            subjectId: subject.id,
            title: testTitle,
            isFree: false,
            isActive: true
          }
        });

        if (!paidTest) {
          // Создаем платный тест
          paidTest = await Test.create({
            subjectId: subject.id,
            title: testTitle,
            description: `Платный тест для углубленного изучения ${subject.name}. Включает сложные вопросы и подробные объяснения.`,
            isFree: false,
            timeLimit: 30 + (i * 10), // 30, 40, 50, 60 минут
            maxScore: 100,
            createdBy: adminUsers[i % adminUsers.length].id, // Распределяем между админами
            isActive: true
          });

          console.log(`✓ Created paid test: ${testTitle} (${subject.name})`);

          // Создаем вопросы для платного теста (более сложные)
          const questionCount = 10 + (i * 2); // 10, 12, 14, 16 вопросов
          for (let q = 0; q < questionCount; q++) {
            await Question.create({
              testId: paidTest.id,
              questionText: `${subject.name}: Вопрос ${q + 1} (Продвинутый уровень)`,
              options: [
                { text: 'Вариант ответа A' },
                { text: 'Вариант ответа B' },
                { text: 'Вариант ответа C' },
                { text: 'Вариант ответа D' }
              ],
              correctAnswer: q % 4, // Чередуем правильные ответы
              explanation: `Подробное объяснение для вопроса ${q + 1} по предмету ${subject.name}`,
              points: 10,
              createdBy: adminUsers[i % adminUsers.length].id
            });
          }

          console.log(`  ✓ Added ${questionCount} questions`);
        } else {
          console.log(`✓ Paid test already exists: ${testTitle}`);
        }
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
          },
          {
            name: 'Юриспруденция',
            averageScore: 190,
            minScore: 170,
            duration: 4,
            description: 'Подготовка юристов для работы в судах, прокуратуре и адвокатуре'
          },
          {
            name: 'Журналистика',
            averageScore: 175,
            minScore: 155,
            duration: 4,
            description: 'Подготовка журналистов для работы в СМИ и медиа-компаниях'
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
          },
          {
            name: 'Горное дело',
            averageScore: 165,
            minScore: 145,
            duration: 4,
            description: 'Подготовка горных инженеров для работы в горнодобывающей промышленности'
          }
        ]
      },
      {
        name: 'Кыргызский государственный медицинский университет имени И.К. Ахунбаева',
        nameKg: 'И.К. Ахунбаев атындагы Кыргыз мамлекеттик медициналык университети',
        description: 'Ведущий медицинский университет Кыргызстана, готовящий врачей различных специальностей.',
        photo: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?w=800',
        address: 'г. Бишкек, ул. Ахунбаева, 92',
        website: 'https://www.kgmu.kg',
        phone: '+996 (312) 54-11-11',
        email: 'info@kgmu.kg',
        specialties: [
          {
            name: 'Лечебное дело',
            averageScore: 200,
            minScore: 180,
            duration: 6,
            description: 'Подготовка врачей общей практики'
          },
          {
            name: 'Педиатрия',
            averageScore: 195,
            minScore: 175,
            duration: 6,
            description: 'Подготовка детских врачей'
          },
          {
            name: 'Стоматология',
            averageScore: 205,
            minScore: 185,
            duration: 5,
            description: 'Подготовка стоматологов'
          },
          {
            name: 'Фармация',
            averageScore: 180,
            minScore: 160,
            duration: 5,
            description: 'Подготовка фармацевтов'
          }
        ]
      },
      {
        name: 'Кыргызский экономический университет имени М. Рыскулбекова',
        nameKg: 'М. Рыскулбеков атындагы Кыргыз экономикалык университети',
        description: 'Ведущий экономический университет Кыргызстана, готовящий экономистов, менеджеров и финансистов.',
        photo: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800',
        address: 'г. Бишкек, ул. Абдымомунова, 205',
        website: 'https://www.keu.kg',
        phone: '+996 (312) 54-22-22',
        email: 'info@keu.kg',
        specialties: [
          {
            name: 'Финансы и кредит',
            averageScore: 185,
            minScore: 165,
            duration: 4,
            description: 'Подготовка финансистов для работы в банках и финансовых компаниях'
          },
          {
            name: 'Менеджмент',
            averageScore: 180,
            minScore: 160,
            duration: 4,
            description: 'Подготовка менеджеров для управления организациями'
          },
          {
            name: 'Маркетинг',
            averageScore: 175,
            minScore: 155,
            duration: 4,
            description: 'Подготовка специалистов по маркетингу и рекламе'
          },
          {
            name: 'Бухгалтерский учет',
            averageScore: 170,
            minScore: 150,
            duration: 4,
            description: 'Подготовка бухгалтеров для работы в различных организациях'
          }
        ]
      },
      {
        name: 'Кыргызский государственный университет строительства, транспорта и архитектуры',
        nameKg: 'Кыргыз мамлекеттик курулуш, транспорт жана архитектура университети',
        description: 'Специализированный университет, готовящий специалистов в области строительства, транспорта и архитектуры.',
        photo: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800',
        address: 'г. Бишкек, ул. Малдыбаева, 34',
        website: 'https://www.kgsuta.kg',
        phone: '+996 (312) 54-33-33',
        email: 'info@kgsuta.kg',
        specialties: [
          {
            name: 'Промышленное и гражданское строительство',
            averageScore: 175,
            minScore: 155,
            duration: 4,
            description: 'Подготовка инженеров-строителей'
          },
          {
            name: 'Автомобильные дороги и аэродромы',
            averageScore: 170,
            minScore: 150,
            duration: 4,
            description: 'Подготовка специалистов по строительству дорог'
          },
          {
            name: 'Транспортные системы',
            averageScore: 165,
            minScore: 145,
            duration: 4,
            description: 'Подготовка специалистов по организации транспортных систем'
          }
        ]
      },
      {
        name: 'Ошский государственный университет',
        nameKg: 'Ош мамлекеттик университети',
        description: 'Крупнейший университет юга Кыргызстана, готовящий специалистов различных направлений.',
        photo: 'https://images.unsplash.com/photo-1562774053-701939374585?w=800',
        address: 'г. Ош, ул. Ленина, 331',
        website: 'https://www.oshsu.kg',
        phone: '+996 (3222) 5-55-55',
        email: 'info@oshsu.kg',
        specialties: [
          {
            name: 'Педагогика',
            averageScore: 160,
            minScore: 140,
            duration: 4,
            description: 'Подготовка учителей для школ'
          },
          {
            name: 'Филология',
            averageScore: 165,
            minScore: 145,
            duration: 4,
            description: 'Подготовка филологов и лингвистов'
          },
          {
            name: 'История',
            averageScore: 155,
            minScore: 135,
            duration: 4,
            description: 'Подготовка историков и преподавателей истории'
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
    console.log('\n📋 Admin credentials:');
    for (const admin of adminUsers) {
      console.log(`\n  Admin: ${admin.firstName} ${admin.lastName}`);
      console.log(`    Phone: ${admin.phone}`);
      console.log(`    Email: ${admin.email || 'не указан'}`);
      console.log(`    Password: admin123`);
    }
    console.log('\n📊 Statistics:');
    console.log(`  - Admins: ${adminUsers.length}`);
    console.log(`  - Subjects: ${subjects.length}`);
    const allTests = await Test.findAll();
    const freeTests = allTests.filter(t => t.isFree).length;
    const paidTests = allTests.filter(t => !t.isFree).length;
    console.log(`  - Free tests: ${freeTests}`);
    console.log(`  - Paid tests: ${paidTests}`);
    const allUniversities = await University.findAll();
    console.log(`  - Universities: ${allUniversities.length}`);
    const allSpecialties = await Specialty.findAll();
    console.log(`  - Specialties: ${allSpecialties.length}`);
    console.log('\n✅ You can now:');
    console.log('  1. Login as any admin');
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
