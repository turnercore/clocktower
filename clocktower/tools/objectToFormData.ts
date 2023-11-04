function objectToFormData(obj: { [key: string]: any }) {
  // Validate input as an object otherwise return an empty FormData object
  if (typeof obj !== 'object') {
    console.error('objectToFormData: input is not an object')
    return new FormData()
  }

  const formData = new FormData()
  Object.keys(obj).forEach((key) => {
    formData.append(key, obj[key])
  })
  return formData
}

export default objectToFormData
