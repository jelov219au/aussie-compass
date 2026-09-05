import { HomePremiumToolExplorer } from "@/components/sections/HomePremiumToolExplorer";
import { Container } from "@/components/ui/Container";
import { getRentalApplicationPaymentReadiness, isResumeProLive } from "@/lib/commerce";
import { selectHomePremiumProduct } from "@/lib/homePremiumRecommendation";
import { getProCatalogProducts } from "@/lib/proCatalogProducts";

export function PremiumToolsSection() {
  const products = getProCatalogProducts(isResumeProLive(), getRentalApplicationPaymentReadiness().ready);
  const featuredProduct = selectHomePremiumProduct(products);

  return (
    <section id="pro" className="scroll-mt-20 bg-surface py-12 sm:py-16" aria-labelledby="premium-tools-heading">
      <Container>
        <HomePremiumToolExplorer products={products} initialProductId={featuredProduct?.id} />
      </Container>
    </section>
  );
}
