export function contains(str1: string, str2: string, isCaseSensitive: boolean = true) {
  if(!str1 && !str2) {
    return true;
  }

  if(str1 && !str2) {
    return true;
  }

  if(str2 && !str1) {
    return false;
  }

  if(!isCaseSensitive) {
    str1 = str1.toLowerCase();
    str2 = str2.toLowerCase();
  }

  const res = str1.indexOf(str2) != -1;
  return res;
}
