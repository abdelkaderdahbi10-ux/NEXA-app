// ===== INIT =====
var client = window.supabase.createClient(
  "https://axkknkamcxwdzpdpiukz.supabase.co",
  "sb_publishable_pPS1wkAnog6wQhp4Bu2qSQ_Y36zz3NJ"
)

// ===== AUTH =====
async function register() {
  const email = document.getElementById("email").value.trim()
  const password = document.getElementById("password").value.trim()

  const { error } = await client.auth.signUp({ email, password })
  if (error) return alert(error.message)

  alert("تفقد الإيميل ديالك")
}

async function login() {
  const email = document.getElementById("email").value.trim()
  const password = document.getElementById("password").value.trim()

  const { error } = await client.auth.signInWithPassword({ email, password })
  if (error) return alert(error.message)

  checkUser()
}

async function logout() {
  await client.auth.signOut()
  checkUser()
}

// ===== CHECK USER =====
async function checkUser() {
  const { data } = await client.auth.getUser()

  if (data.user) {
    authSection.style.display = "none"
    appSection.style.display = "block"
    loadFeed()
  } else {
    authSection.style.display = "block"
    appSection.style.display = "none"
  }
}

// ===== CREATE POST =====
async function createPost() {
  const { data } = await client.auth.getUser()
  if (!data.user) return alert("سجل الدخول")

  const content = postContent.value.trim()
  const file = mediaFile.files[0]

  let filePath = null
  let mediaType = null

  if (file) {
    const ext = file.name.split(".").pop()
    filePath = `${data.user.id}/${Date.now()}.${ext}`

    const { error } = await client.storage
      .from("media")
      .upload(filePath, file)

    if (error) return alert(error.message)

    mediaType = file.type.startsWith("image") ? "image" : "video"
  }

  await client.from("posts").insert([
    {
      user_id: data.user.id,
      content,
      media_url: filePath,
      media_type: mediaType
    }
  ])

  postContent.value = ""
  mediaFile.value = ""

  loadFeed()
}

// ===== LOAD FEED =====
async function loadFeed() {
  const { data: posts } = await client
    .from("posts")
    .select("*")
    .order("created_at", { ascending: false })

  feed.innerHTML = ""

  if (!posts) return

  posts.forEach(post => {
    let mediaHTML = ""

    if (post.media_url) {
      const { data } = client.storage
        .from("media")
        .getPublicUrl(post.media_url)

      const url = data.publicUrl

      if (post.media_type === "image")
        mediaHTML = `<img src="${url}">`

      if (post.media_type === "video")
        mediaHTML = `<video src="${url}" controls></video>`
    }

    feed.innerHTML += `
      <div class="post">
        <p>${post.content || ""}</p>
        ${mediaHTML}
      </div>
    `
  })
}

// ===== EVENTS =====
registerBtn.onclick = register
loginBtn.onclick = login
logoutBtn.onclick = logout
postBtn.onclick = createPost

checkUser()