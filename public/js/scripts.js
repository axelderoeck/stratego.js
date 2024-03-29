// Get the url parameters and put them in an object
var game = {};
window.location.search
  .replace(/[?&]+([^=&]+)=([^&]*)/gi, function(str,key,value) {
    game[key] = value;
  }
);

// Generate random string
const generateString = (length) => {
    var result = '';
    var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for ( var i = 0; i < length; i++ ) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}

new ClipboardJS('#copyBtn');