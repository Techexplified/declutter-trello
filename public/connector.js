// connector.js
var BASE_URL = "https://declutter-trello.vercel.app";

TrelloPowerUp.initialize({
  "board-buttons": function (t, options) {
    return t.get("member", "private", "token").then(function (token) {
      if (!token) {
        return [
          {
            icon: {
              dark: BASE_URL + "/images/icon-dark.svg",
              light: BASE_URL + "/images/icon-light.svg",
            },
            text: "Authorize Declutter",
            callback: function (t) {
              return t.showAuthorization();
            },
          },
        ];
      }

      return [
        {
          icon: {
            dark: BASE_URL + "/images/icon-dark.svg",
            light: BASE_URL + "/images/icon-light.svg",
          },
          text: "Declutter",
          callback: function (t) {
            return t.modal({
              title: "Declutter",
              url: BASE_URL + "/popup.html",
              height: 400,
            });
          },
        },
      ];
    });
  },
  "authorization-status": function (t, options) {
    return t.get("member", "private", "token").then(function (token) {
      return { authorized: !!token };
    });
  },
  "show-authorization": function (t, options) {
    return t.popup({
      title: "Authorize Declutter",
      url: "./authorize.html",
      height: 140,
    });
  },
});
