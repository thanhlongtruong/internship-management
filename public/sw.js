self.addEventListener("push", (event) => {
  const data = event.data?.json();

  const title = data.title || "Website Quản lý thực tập";
  const options = {
    body: data.body || "Bạn có một thông báo mới!",
    icon: "/icon.png",
  };

  event.waitUntil(self.registration.showNotification(title, options));
});
