import IdRollBand from './IdRollBand';
import AboutApaar from './AboutApaar';
import Faq from './Faq';

/** Drop this directly below the hero in pages/Landing.tsx. */
export default function AfterHero() {
  return (
    <>
      <IdRollBand />
      <AboutApaar />
      <Faq />
    </>
  );
}
