var BASE_URL = "https://declutter-trello.vercel.app";

TrelloPowerUp.initialize({
  "board-buttons": function (t, options) {
    return [
      {
        icon: {
          dark: BASE_URL + "/images/icon-dark.svg",
          light: BASE_URL + "/images/icon-light.svg",
        },
        text: "Declutter",
        callback: function (t) {
          return t.modal({
            title: "Declutter – Stale Card Manager",
            url: BASE_URL + "/popup.html",
            height: 400,
          });
        },
      },
    ];
  },
  "authorization-status": function (t, options) {
    return t
      .get("member", "private", "token")
      .then((token) => ({ authorized: !!token }));
  },

  // ✨ ADD THIS MISSING SECTION SO THE SETTINGS LINK WORKS
  "show-authorization": function (t, options) {
    return t.modal({
      title: "Authorize Declutter Account",
      url: BASE_URL + "/popup.html", // Directs them straight to your popup.html to trigger auth!
      height: 420,
    });
  },
});
