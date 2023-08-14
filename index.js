


// "https://api.vk.com/method/wall.get?owner_id=-9273458&domain=shikimori&count=5&access_token=vk1.a.Q4T6lgDmOZ5T4yHTsm-lbKwkk7uE8XRDse6T2Q99xPWXjMFBc78C4UXlcmXiG3JchQDo7Bdnxf6MhF_EJYbdIp4-6p3k0fTu3A2rDKSjDeXFoAMc7raj-vpqjCnZR6otaAOAlS-ohWH7pDffcrwDrIsg4qdIkmeBRBX6iOpQsf9YvctKU-VCEtcDQA7Z0o-8PyRWB70NnbZNuCE3ICTDLQ&v=5.131";
// https://oauth.vk.com/authorize?client_id=51728435&display=page&redirect_uri=https://dashinin.github.io/wb_L1-19&scope=wall&response_type=token&v=5.131&state=123456

// window.location.href = 'https://oauth.vk.com/authorize?client_id=51728435&display=page&redirect_uri=https://dashinin.github.io/wb_L1-19&scope=wall&response_type=token&v=5.131&state=123456'
//ww
console.log(window.location.hash)

const wrapper = document.querySelector('.wrapper')
const trigger = document.querySelector('.trigger')

const count = 5;
let offset = 0;

const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        fetchPosts();
      }
    });
  });


const fetchPosts = async () =>
    VK.Api.call('wall.get', {
        owner_id: -9273458,
        domain: 'shikimori', 
        count: count,
        offset: offset,
        access_token: 'vk1.a.Q4T6lgDmOZ5T4yHTsm-lbKwkk7uE8XRDse6T2Q99xPWXjMFBc78C4UXlcmXiG3JchQDo7Bdnxf6MhF_EJYbdIp4-6p3k0fTu3A2rDKSjDeXFoAMc7raj-vpqjCnZR6otaAOAlS-ohWH7pDffcrwDrIsg4qdIkmeBRBX6iOpQsf9YvctKU-VCEtcDQA7Z0o-8PyRWB70NnbZNuCE3ICTDLQ',
        v: 5.131
        },  (r) => {
           if(r.response.items) {
            const items = r.response.items
            for (let item of items) {
                const post = newPost(item)
                document.querySelector('.wrapper').appendChild(post)

            }
            offset += count;
            console.log(offset)
            observer.observe(document.querySelector('.post:last-child'))
            
           }
        }
    );
    

const newPost = (item) => {
    const post = document.createElement('div')
    post.className = 'post';

    const postDate = document.createElement('div')
    const dateArr = Date(item.date).split(" ")
    const dateContent = dateArr[1] + " " + dateArr[2] + " " + dateArr[4]
    postDate.textContent = dateContent
    post.appendChild(postDate)

    for (let at of item.attachments) {
        if(at.type === 'photo') {
            const postImg = document.createElement('img')
            postImg.className = 'post__img'
            postImg.src = at['photo'].sizes[4].url
            post.appendChild(postImg)
            break
        }
       
     }

    const postText = document.createElement('p')
    postText.textContent = item.text;

    post.appendChild(postText)
    return post
}


fetchPosts();









