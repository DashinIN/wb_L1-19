// 19.	Реализовать виджет, отображающий список постов из любого паблика в VK. Виджет должен иметь фиксированные
// размеры и возможность прокрутки. При прокрутке содержимого виджета до конца должны подгружаться новые посты.
// Необходимо реализовать возможность кэширования уже загруженных данных: если пользователь закрыл страницу, а 
// потом снова открыл ее, виджет должен отображать все загруженные ранее данные (новые данные должны 
// подгружаться из учетом уже загруженных ранее).
// При переполнении localStorage, данные, загруженные последними должны вытеснять данные загруженные первыми.

// 20.Реализовать функцию подсчета объема памяти занимаемого данными в LocalStorage для предыдущей задачи. 
// При изменении данных в localStorage в консоль должен выводиться объем занятой памяти / максимальный размер
//  хранилища.



//Количество постов, которое будем подгружать порциями
const count = 5;

//Вспомогательные функции для работы с localStorage
const saveToLocalStorage = (key, data) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error('Error saving to localStorage:', error);
  }
};

const loadFromLocalStorage = key => {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Error loading from localStorage:', error);
    return null;
  }
};

//Получаем вычисленный объем локального хранилища
const cachedLocalStorageSize = loadFromLocalStorage('cachedLocalStorageSize');

//Если ранее объем локального хранилища не был вычислен, находим его способом, примененным в 18 задании:
if(!cachedLocalStorageSize) {
  let value = 'Lorem ipsum dolor sit amet consectetur adipisicing elit. Minima inventore adipisci consectetur, numquam aliquam magni sequi unde voluptatum, quos repellendus quis odit itaque saepe cupiditate qui enim illum! Beatae, dolor?'
  //Отчищаем localStorage перед заполнением
  window.localStorage.clear()
  let i = 0;
  //Заходим в бесконечный цикл
  while(true) {
      try {
          //Заполняем хранилище
          window.localStorage.setItem(`${i}`, value);
          } catch (e) {
              //При переполнении ловим ошибку, выходим из цикла
              break
          }
          i++
  }
  //Считаем размер всех полей localStorage
  let totalLength = 0
  for (let item in localStorage) {
      if (!localStorage.hasOwnProperty(item)) {
          continue;
      }
      //Внутренняя кодировка строк в JavaScript – это UTF-16, то есть под каждый символ отводится ровно два байта.
      //Складываем длинну ключа и значения, получаем объем в байтах.
      let itemLength = ((localStorage[item].length + item.length) * 2);
      totalLength += itemLength; 
  };
  window.localStorage.clear()
  saveToLocalStorage('cachedLocalStorageSize', totalLength);
}


//Функция которая отслеживает состояние локального хранилища
const manageLocalStorageOverflow = () => {
  //Получает размер хранилища и размер постов, которые находятся в LocalStorage
  const cachedData = loadFromLocalStorage('cachedPosts');
  //Внутренняя кодировка строк в JavaScript – это UTF-16, то есть под каждый символ отводится ровно два байта.
  const cachedDataSize = ((JSON.stringify(cachedData).length) * 2);
  const cachedLocalStorageSize = loadFromLocalStorage('cachedLocalStorageSize');

  //Консольный вывод
  console.log("Объем занятой памяти " + (cachedDataSize/1024).toFixed(3) + ' Кб')
  console.log("Объем локального хранилища " + (cachedLocalStorageSize/(1024)).toFixed(3) + ' Кб')
  console.log("объем занятой памяти / максимальный размер хранилища  = " 
  + ((cachedDataSize/cachedLocalStorageSize)/(1024)).toFixed(5))
  console.log("  ")

  //10 Кб для запаса
  const delta = 1024*10
  //Когда объем занимаемый постами в LocalStorage приблизится на delta к величине хранилища
  //Старые посты будут удаляться, чтобы хватало место для новых.
  if (cachedData && cachedDataSize + delta > cachedLocalStorageSize) {
    // Remove the earliest posts to maintain the maximum number of cached items
    const numItemsToRemove = count;
    cachedData.splice(0, numItemsToRemove);
    saveToLocalStorage('cachedPosts', cachedData);
  }
};

//Получаем токен для VK API из строки запроса
const token = window.location.hash.split("=")[1].split("&")[0]
const wrapper = document.querySelector('.wrapper')
const trigger = document.querySelector('.trigger')

let offset = loadFromLocalStorage('cachedOffset') || 0; 
//Количество постов от начала ленты, относительно которого будем подгружать новые порции
//Изначально равен 0 - загружаем с самого начала ленты.

//Логика прогрузки бесконечной ленты релизуется с помощью IntersectionObserver
const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      //Каждый раз когда таргет попадает в поле зрения (происходит прокрутка до конца виджета)
      if (entry.isIntersecting) {
        //Сначала убирается старый таргет, так как лента изменилась, и нужно отслеживать 
        //новое нижнее положение прокрутки виджета
        observer.unobserve(entry.target);
        //Далее отправляется запрос на получение новой порции постов
        fetchPosts();
      }
    });
  }, { threshold: 0.5});


//С помощью VK API делаем вызов к конкретному сообществу, передавая токен авторизованного пользователя
const fetchPosts = async () =>
    VK.Api.call('wall.get', {
        owner_id: -208050206,
        domain: 'vkdigitaltech', 
        count: count,
        offset: offset,
        access_token: token,
        v: 5.131
        },  (r) => {
           if(r.response.items) {
            //При получении новых данных выполняем действия по организации локального хранилища и выводим логи 
            manageLocalStorageOverflow();

            const items = r.response.items
            for (let i = 0; i < items.length; i++) {
              //Каждый новый пост добавляем в виджет, данные нового поста добавляем в локальное хранилище
                const [post, postData] = newPost(items[i])
                const cachedData = loadFromLocalStorage('cachedPosts') || [];
                cachedData.push(postData);
                saveToLocalStorage('cachedPosts', cachedData);
                document.querySelector('.wrapper').appendChild(post)
            }
            //Смещаем отступ относительно начала ленты на количество постов которое получили
            offset += count;
            //Обновляем отступ для локального хранилища
            let cachedOffset = loadFromLocalStorage('cachedOffset') || 0;
            cachedOffset = offset
            saveToLocalStorage('cachedOffset', cachedOffset);

            //Новым таргетом для отслеживания с помощью IntersectionObserver становится самый нижний из добавленных постов
            observer.observe(document.querySelector('.post:last-child'))
           }
        }
    );
    
   
//Функция собирает блок поста сообщества из данных с VK API и также возвращает данные поста
const newPost = (item) => {
    const post = document.createElement('div')
    post.className = 'post';
    const postData = {};

    const postDate = document.createElement('div')
    const dateObj = new Date(item.date * 1000)
    const dateContent = dateObj.toLocaleDateString() + " " + dateObj.toLocaleTimeString()
    postDate.textContent = postData.dateContent = dateContent
    post.appendChild(postDate)

    for (let at of item.attachments) {
        if(at.type === 'photo') {
            const postImg = document.createElement('img')
            postImg.className = 'post__img'
            postImg.src = postData.photoUrl = at['photo'].sizes[4].url
            post.appendChild(postImg)
            break
        }
     }

    const postText = document.createElement('p')
    postText.textContent = postData.text = item.text;
    post.appendChild(postText)

    return [post, postData]
}

//Функция собирает блок поста используя данные из локального хранилища о ранее загруженных постах
const createPostFromData = postData => {
  const post = document.createElement('div');
  post.className = 'post';

  const postDate = document.createElement('div');
  postDate.textContent = postData.dateContent;
  post.appendChild(postDate);

  if (postData.photoUrl) {
    const postImg = document.createElement('img');
    postImg.className = 'post__img';
    postImg.src = postData.photoUrl;
    post.appendChild(postImg);
  }

  const postText = document.createElement('p');
  postText.textContent = postData.text;
  post.appendChild(postText);

  return post;
};


//Основная логика работы: получаем данные постов из локального хранилища,
const cachedData = loadFromLocalStorage('cachedPosts');
if (cachedData) {
  //при наличии данных собираем из них посты и добавляем в виджет,
  const postsContainer = document.querySelector('.wrapper');
  for (const postData of cachedData) {
    const post = createPostFromData(postData);
    postsContainer.appendChild(post);
  }
  //затем обновляем таргет для отслеживания прокрутки ленты до конца
  observer.observe(document.querySelector('.post:last-child'))
} else {
  //Если данных в локальном хранилище нет, то просто запрашиваем первую порцию данных
  fetchPosts();
}











