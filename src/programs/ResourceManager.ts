import { Message, TextChannel } from "discord.js";

async function Resource(message: Message) {
  const channel = message.channel as TextChannel;
  switch (channel.name) {
    case "coding":
      message.channel.send(RESOURCES_CODING);
      break;
    case "learning-spanish":
      message.channel.send(RESOURCES_SPANISH);
      break;

    default:
      break;
  }
}

export default Resource;

const RESOURCES_CODING = `

Our own lovely Michel has written a guide tailored for this group that in his own words "gives you a good guess of what awaits you". You can find that here: https://gist.github.com/geisterfurz007/473abe140d3504bc018255597201431e

Our group suggest Javascript as the first language whose rabbit hole you can fall down at the start of your journey. You can read more about Javascript here:
             - CodeCademy online course: <https://www.codecademy.com/learn/javascript>
             - Eloquent Javascript, free book: <http://eloquentjavascript.net/>
             - MDN's JavaScript guide: <https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Introduction>
             - You Don't Know JS (free book series): <https://github.com/getify/You-Dont-Know-JS>
             - Javascript reference/docs: <https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference>
`;

const RESOURCES_SPANISH = `__**Useful resources for #learning-spanish:**__

__**Whatsapp group chat for learning/speaking Spanish**__
<https://chat.whatsapp.com/IYZiHoqqwR67siK4zBm6ba>

__**Google Sheets of Vocabulary (anyone can add words)**__
<https://docs.google.com/spreadsheets/d/1VNIb7LGiXI88l4lxQ8QPiUWYQWT7I4qChJ4S1or69zU/edit?usp=sharing>

__**Apps and TV shows that help with Spanish**__
Apps - Duolingo, Babbel, Rosetta Stone
TV Shows - Narcos, Casa de Paper (Money Heist), Las Chicas del Cable (Cable Girls), Casa del Flores, Escrito Salvaje, Elite, El niño, Escritos Salvaje
Movies - Toc Toc, Yucatán, No se aceptan devoluciones (Instructions Not Included), Seis Metros Sobre el Cielo

__**To teach**__
Good website to learn how to plan a class well <https://www.teachingenglish.org.uk/article/lesson-plans>
Worksheets and lesson plans <https://www.teacherspayteachers.com/Browse/Price-Range/Free/Search:spanish%20distance%20learning> <https://sharemylesson.com/search?search_api_views_fulltext=spanish>

__**For learning**__
Online dictionary 
<https://www.spanishdict.com/>
Website that focuses on learning how to pronounce all the words in the world <https://forvo.com/>`;
