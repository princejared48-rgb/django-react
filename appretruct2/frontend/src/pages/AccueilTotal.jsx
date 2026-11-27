import {HeaderApp,FooterApp} from "../shared/AppretructLayout.jsx";
import Carrosel from "../carrosel.jsx";
import "../shared/appretruct.css";
export default function AccueilTotal(){
 return <><HeaderApp/><main>
 <div className="home-carousel-preserve"><Carrosel/></div>
 <section className="home-extra" id="apropos"><span className="eyebrow">APPRETRUCT</span><h2>Construisez votre avenir professionnel</h2><p>Une plateforme qui facilite la rencontre entre les candidats, les entreprises et les opportunités professionnelles. Créez votre profil et accédez aux services adaptés à votre parcours.</p></section>
 <section className="home-extra" id="formations"><h2>Un espace adapté à chaque profil</h2><p>Candidats, entreprises et administrateurs disposent chacun d'un espace dédié pour retrouver leurs principales fonctionnalités.</p></section>
 </main><FooterApp/></>
}
