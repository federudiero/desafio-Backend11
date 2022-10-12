
export const generateOne = () => {
    return {
      title: faker.commerce.product(),
      price: faker.commerce.price(),
      thumbnail: faker.image.imageUrl(400, 400, undefined, true),
    };
  };
  
  export const generateMany = (prodCount) => {
    const prods = [];
    for (let i = 0; i < prodCount; i++) {
      prods.push(generateOne());
    }
    return prods;
  };