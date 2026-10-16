import { m } from 'motion/react';

import { type PublicProduct } from '@booth/shared';

import { ProductCard } from './product-card';
import { staggerChildren } from '../../../lib/motion';
import { type Cart } from '../../cart/use-cart';

interface ProductSectionProps {
  id: string;
  title: string;
  products: PublicProduct[];
  cart: Cart;
  onOpen: (product: PublicProduct) => void;
}

/** A category: heading plus a grid whose cards stagger in as it scrolls into view. */
export function ProductSection({ id, title, products, cart, onOpen }: ProductSectionProps) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="scroll-mt-20">
      <h2 id={`${id}-title`} className="mb-3 text-lg font-bold tracking-tight">
        {title}
      </h2>
      <m.div
        variants={staggerChildren()}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '0px 0px -10% 0px' }}
        className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
      >
        {products.map((product) => (
          <ProductCard key={product.id} product={product} cart={cart} onOpen={onOpen} />
        ))}
      </m.div>
    </section>
  );
}
