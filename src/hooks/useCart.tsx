import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
    const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart');

    
    //localStorage.removeItem('@RocketShoes:cart')
    //console.log(storagedCart)
    if (storagedCart) {        
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    
    try {
      
      let updated = false
      cart.forEach(product =>{
        if (product.id === productId) {                  
          updateProductAmount({productId: product.id, amount: product.amount + 1})
          updated = true 
        }
      })
      
      
      if (!updated){
        const newProduct : Product = await api.get('/products/' + productId).then(response => response.data)
        if (newProduct){
          newProduct.amount = 1
        
          const updatedCart = cart.concat(newProduct)
          localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCart))
          setCart(updatedCart)
        }
      }

      
    } catch {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {      
      const updatedCart = cart.filter((product) => product.id !== productId )      

      if (cart.length > updatedCart.length){
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCart))
        setCart(updatedCart)
      }else{
        throw new Error('')
      }
    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
  
      
    try {

      const data : Stock = await api.get('/stock/'+ productId)
      .then(response => response.data)      
    
      
      
      if (amount > 0) {
        if (amount > data.amount){
          toast.error('Quantidade solicitada fora de estoque'); 
        }else{
          const updatedCart = cart.map(product => { 
            if (product.id === productId){
               product.amount = amount
            }
            return product
          })
          localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCart))                    
          setCart(updatedCart) 
        }
        
      }
     
    } catch {
      toast.error('Erro na alteração de quantidade do produto');
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
