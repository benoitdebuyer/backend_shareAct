function checkBody(body, keys) {

  /// modules utilisé dans l'application poru verifier que les champs recu ne soit pas vide.
    let isValid = true;
  
    for (const field of keys) {
      console.log(field)
      if (!body[field] || body[field] === '') {
        isValid = false;
      }
      
    }
  
    return isValid;
  }
  
  module.exports = { checkBody };
  