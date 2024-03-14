export default class Utils {
  static getRndInteger(min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
  }
  
  static async sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}