import './App.css';
import Audio from './Audio';
import Note from './Note';
import Poem from './Poem';
import Search from './Search';
import logo from './assets/logo_writersalmanac.png';
import React, { useState, useEffect} from 'react';
import { Storage } from 'aws-amplify';
import DOMPurify from 'dompurify';
import ColorScroll from 'react-color-scroll';


function formatDate(newDate,notToday=true, separator=''){
  
  let date = newDate.getDate();
  let month = newDate.getMonth() + 1;
  let year = newDate.getFullYear();
  let fDate = `${year}${separator}${month<10?`0${month}`:`${month}`}${separator}${date<10?`0${date}`:`${date}`}`;
  if(notToday){
    if(Number(fDate) < 19930101){
      fDate = '19930101';
    } else if (Number(fDate) > 20171129){
      fDate = '20171129';
    }
  }  
  return fDate;
}

const presentDate = () => {
  const holder = formatDate(new Date(), false);
if (holder.substring(0,4) === '2023'){
  return'2017' + holder.substring(4,);
}
else if (holder.substring(0,4) === '2024'){
  return'1996' + holder.substring(4,);
}
else {
  return'2014' + holder.substring(4,);
}};

const formatAuthorDate = (dateString) => {
  const monthAbb = { Jan: "01", Feb: "02", Mar: "03", Apr: "04", May: "05", Jun: "06", Jul: "07", Aug: "08", Sep: "09", Oct: "10", Nov: "11", Dec: "12" };
  
  console.log(dateString);
  const splitDate = dateString.trim().split(' ');
  var variance = 0;
  console.log(splitDate);
  if (splitDate.length === 4){
    variance = 1;
  }
  const month = monthAbb[splitDate[0].replace('.', '')];
  const year = splitDate[2 + variance];
  const day = splitDate[1 + variance].replace(',',"");
  console.log(month);
  console.log(year);
  console.log(day);
  const formattedMonth = (new Date(`${month} ${day}, ${year}`).getMonth() + 1).toString().padStart(2, '0');
  const formattedDay = day.replace(',', '').padStart(2, '0');

  return `${year}${formattedMonth}${formattedDay}`;
};

function App() {
  const [linkDate, setLinkDate] = useState(presentDate);
  const [day, setDay] = useState(' ');
  const [date, setCurrentDate] = useState(' ');
  const [transcript, setTranscript] = useState(' ');
  const [poemTitle, setPoemTitle] = useState(' ');
  const [poem, setPoem] = useState(' ');
  const [author, setAuthor] = useState(' ');
  const [authorData, setAuthorData] = useState('');
  const [note, setNote] = useState(' ');
  const [mp3, setMP3] = useState('');
  const changeAuthor = (x) =>{ 
    setLinkDate(x);
  };
  
  const dateOrAuthor = ({query}) => {
      const holder = Object.keys(query).map(function (key){
        return query[key];
      });
      if(holder.length > 2){
        const date = new Date(holder.slice(2,3).toString());
        setLinkDate(formatDate(date));
      }else {
        setLinkDate(holder.slice(0,1).toString());
      }
      console.log('dateOrAuthor');
  }


  const changeDate = async (x) => {
    console.log('changeDate');
    if (/\d/.test(linkDate)) {
      const holderDate = new Date(linkDate.substring(0, 4) + "-" + linkDate.substring(4, 6) + "-" + linkDate.substring(6));
      const forwardDateHolder = new Date(holderDate);
      forwardDateHolder.setDate(holderDate.getDate() + (x === 'back' ? 0 : 2));
      setLinkDate(formatDate(forwardDateHolder));
      
    } else {
        const arr = sortedAuthors;
        
        const index = arr.indexOf(linkDate);
        console.log(index);
        if (index === -1) {
          return null; 
        }
    
        const before = index === 0 ? arr[arr.length - 1] : arr[index - 1];
        const after = index === arr.length - 1 ? arr[0] : arr[index + 1];
        
        setLinkDate( x === 'back' ? before : after);
     
    }
  };
  
  
  useEffect(() => {
    async function getData() {
     const fetchedData = await Storage.get(linkDate.toString() + '.txt', { download:true});
     fetchedData.Body.text().then(string => {
        const splitString = string.split('####');
        if (/\d/.test(linkDate)) {
          const sanitizedSplitString = splitString.map((item) => DOMPurify.sanitize(item));
          
          setDay(sanitizedSplitString[1].replaceAll(/[^\x20-\x7E]/g, ''));
          setCurrentDate(sanitizedSplitString[2].replaceAll(/[^\x20-\x7E]/g, ''));
          setTranscript(sanitizedSplitString[4].replaceAll(/[^\x20-\x7E]/g, ''));
          setPoemTitle(sanitizedSplitString[5].replaceAll(/[^\x20-\x7E]/g, ''));
          setAuthor(sanitizedSplitString[6].replaceAll(/[^\x20-\x7E]/g, ''));
          setPoem(sanitizedSplitString[7].replaceAll('\\', '').replaceAll(/[^\x20-\x7E]/g, ''));
          setNote(sanitizedSplitString[8].replaceAll(/[^\x20-\x7E]/g, ''));
        } else {
          setAuthorData(splitString);
        }
      });
      const fetchedmp3 = await Storage.get(linkDate.toString()  + '.mp3');
      setMP3(fetchedmp3);
    }
    getData();
  }, [linkDate]);

  const Body = () => {
    if (/\d/.test(linkDate)) {
      return (
        <div className="Container">
          <div className="PoemContainer">
            <Poem poemTitle={poemTitle} poem={poem} changeAuthor={changeAuthor} author={author} />
          </div>
          <div className="NoteContainer">
            <Note note={note} />
          </div>
        </div>
      );
    } else {
      
      
      const authors = Array.isArray(authorData) ? authorData : [authorData];
  
      const handleClick = (item) => {
        
        setLinkDate(formatAuthorDate(item));
      };
      if (!authorData) {
        return null; 
      }
      const authorPoems = authors.map((item, index) => {
        const [firstItem, , thirdItem] = item.split('****');
        const newFirstItem = firstItem.replaceAll(/[^\x20-\x7E]/g, '');
        return (
          <div className="Container">
            
            <button className="AuthorButton" onClick={() => handleClick(thirdItem)}>
              {newFirstItem}
            </button>
            <div className="PoemDate">{thirdItem}</div>
            <div className="PoemFormatContainer"></div>
          </div>
        );
      });
      return <div>{authorPoems}</div>;
    }
  };
  
  
  return (
    <div className="App">
      <ColorScroll
        colors={['#8f9193', '#8a9aa8', '#8293a2', '#6c8193', '#0c4b6e']}
        className='my-color-scroll' >
        
        <header className="App-header">
        <img className="LogoImage" src={logo} alt="LOGO"></img>
        <div className="FormattingContainer"></div>
        <Search className="SearchBar"  onDateOrAuthor={dateOrAuthor} linkDate={linkDate} />
        <div className="holder">
        
          <div className="DateContainer" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(day) } }></div>
          <div className="DateContainer" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(date) } }></div>
          </div>
        </header>
    
        <Audio searchedTerm={linkDate}transcript={transcript} mp3Link={mp3} onChangeDate={changeDate}/>
        <Body></Body>
        </ColorScroll>
        
    </div>
  );
}

const sortedAuthors = ['Edward Abbey', 'Diane Ackerman', 'Virginia Hamilton Adair', 'Fleur Adcock', 'Kim Addonizio', 'George Ade', 'James Agee', 'Kelli Russell Agodon', 'Rick Agran', 'Allan Ahlberg', 'Conrad Aiken', 'Ellery Akers', 'Francisco Alarcon', 'Dan Albergotti', 'Henry Aldrich', 'Claribel Alegria', 'Cecil Frances Alexander', 'Elizabeth Alexander', 'Sherman Alexie', 'Debra Allbery', 'Dick Allen', 'Gilbert Allen', 'Heather Allen', 'Henry Allen', 'William Allingham', 'Julia Alvarez', 'Yehuda Amichai', 'Daniel Anderson', 'Idris Anderson', 'Maggie Anderson', 'Nigel Andrew', 'Ginger Andrews', 'Nin Andrews', 'Fred Andrle', 'Barbara Tanner Angell', 'Maya Angelou', 'Anonymous', 'Aaron Anstett', 'Alison Apotheker', 'Philip Appleman', 'Simon Armitage', 'James Armstrong', 'Bob Arnold', 'Matthew Arnold', 'Darnell Arnoult', 'John Ashbery', 'Renee Ashley', 'Margaret Atwood', 'W. H. Auden', 'Elizabeth Austen', 'James A. Autry', 'Charles Badger', 'William Baer', 'David Baker', 'John Balaban', 'Ned Balbo', 'Angela Ball', 'Sally Ball', 'John Banks', 'Ellen Bannister', 'Karen S. Bard', 'Sabine Baring-Gould', 'George Barker', 'Coleman Barks', 'Jim Barnes', 'Kate Barnes', 'Willis Barnstone', 'Patricia Barone', 'John Barr', 'Judith Barrington', 'Christian Barter', 'Ellen Bass', 'Edgar Bateman', 'Grace Bauer', 'Jeffrey Bean', 'Henry Beard', 'Jan Beatty', 'Jeanne Marie Beaumont', 'Robert Becker', 'Robin Becker', 'Sandra Becker', 'Marck L. Beggs', 'June Robertson Beisch', 'Marvin Bell', 'Joe David Bellamy', 'Hilaire Belloc', 'Elinor Benedict', 'David Bengtson', 'Jacqueline Berger', 'Kristin Berkey-Abbott', 'Ted Berrigan', 'Wendell Berry', 'John Berryman', 'John Betjeman', 'Jill Bialosky', 'Ambrose Bierce', 'George Bilgere', 'Anne Alexander Bingham', 'Elizabeth Bishop', 'Candace Black', 'Ralph Black', 'William Blake', 'Randy Blasing', 'Sally Bliumis-Dunn', 'Ron Block', 'Barbara Bloom', 'Michael Blumenthal', 'Robert Bly', 'Louise Bogan', 'Eric Bogle', 'Michelle Boisseau', 'Eavan Boland', 'Eaven Boland', 'Kathleen Sheeder Bonanno', 'Paula Bonnell', 'Nancy Bontilier', 'Philip Booth', 'Karina Borowicz', 'Laure-Anne Bosselaar', 'David Bottoms', 'Nancy Boutilier', 'Nancy Boutillier', 'Cathy Smith Bowers', 'Neal Bowers', 'George Bradley', 'Anne Bradstreet', 'Harold Branam', 'John Brantingham', 'Jill Breckenridge', 'John Brehm', 'Matthew Brennan', 'Peg Bresnahan', 'Nicholas Bretton', 'Gaylord Brewer', 'Robert Bridges', 'Kim Bridgford', 'Mary Dow Brine', 'Stewart Brisby', 'Anthony Brode', 'Lucille Broderson', 'William Bronk', 'Anne Bronte', 'Emily Bronte', 'Gwendolyn Brooks', 'Phillips Brooks', 'Catharine Savage Brosman', 'James Broughton', 'Kevin Brown', 'Marcia F. Brown', 'Rosellen Brown', 'Sterling A. Brown', 'Michael Dennis Browne', 'Susan Browne', 'Elizabeth Barrett Browning', 'Robert Browning', 'Gil Broxson', 'Sharon Bryan', 'Philip Bryant', 'William Cullen Bryant', 'Linda S. Buckmaster', 'David Budbill', 'Andrea Hollander Budy', 'Charles Bukowski', 'John Bunyan', 'Robert Burns', 'John Burroughs', 'Reid Bush', 'Gary Busha', 'Gary Busha', 'Paul Bussan', 'Denver Butson', 'Bobby Byrd', 'George Gordon Byron', 'Lord Byron', 'Julie Cadwallader-Staub', 'Gabrielle Calvocoressi', 'Norman Cameron', 'Ann Campanella', 'Thomas Campion', 'Rafael Campo', 'Madelyne Camrud', 'Hughie Cannon', 'Dennis Caraher', 'Richard Carlander', 'Andrea Carlisle', 'Ron Carlson', 'Thomas Carlyle', 'Julia A. Carney', 'Lewis Carol', 'Anne Nicodemus Carpenter', 'William Carpenter', 'Thomas Carper', 'Jim Carroll', 'Lewis Carroll', 'Hayden Carruth', 'Charles E. Carryl', 'Guy Wetmore Carryl', 'Ciaran Carson', 'Jo Carson', 'Jimmy Carter', 'Raymond Carver', 'Johnny Cash', 'Maxine Cassin', 'Anne Caston', 'Susan Cataldo', 'Willa Cather', 'Charles Causley', 'Constantine Cavafy', 'Grace Cavalieri', 'Richard Cecil', 'Thomas Centolella', 'Francette Cerulli', 'Tom Chandler', 'Robin Chapman', 'Fred Chappell', 'Geoffrey Chaucer', 'Maxine Chernoff', 'Kelly Cherry', 'G. K. Chesterton', 'G.K. Chesterton', 'Lydia Maria Child', 'Margaret Chilton', 'Michael Chitwood', 'Nicholas Christopher', 'John Ciardi', 'Joanne Cimburg', 'Sandra Cisneros', 'David Citino', 'Amy Clampitt', 'John Clare', 'Amy M. Clark', 'Jim Clark', 'Thomas A. Clark', 'Tom Clark', 'Michael Cleary', 'Suzanne Cleary', 'H. Clemons', 'Harry Clifton', 'Lucille Clifton', 'Arthur Hugh Clough', 'Elizabeth Coatsworth', 'Robert Trystam Coffin', 'Andrea Cohen', 'Nan Cohen', 'Todd Colby', 'Henri Cole', 'Marjorie Kowalski Cole', 'Wanda Coleman', 'Samuel Taylor Coleridge', 'Michael Collier', 'Billy Collins', 'Martha Collins', 'Geraldine Connolly', 'J. L. Conrad', 'Matt Cook', 'Peter Cooley', 'Susan Coolidge', 'George Cooper', 'Wyn Cooper', 'Robert Cooperman', 'Wendy Cope', 'Maryann Corbett', 'Robert Cording', 'Cid Corman', 'Frances Cornford', 'Mary Cornish', 'H. R. Coursen', 'Noel Coward', 'William Cowper', 'Jimmie Cox', 'Mark Cox', 'Hart Crane', 'Stephen Crane', 'Robert Creeley', 'Thomas Crew', 'Barbara Crooker', 'Mary Crow', 'Victor Hernandez Cruz', 'Mary I. Cuffe', 'Richard Cumberland', 'E. E. Cummings', 'Deborah Cummins', 'James Cummins', 'Allan Cunningham', 'Stephen Cushman', 'Philip Dacey', 'Roald Dahl', 'David Daiches', 'Ruth Daigon', 'Michael Daley', 'Ruth Dallas', 'Richard Henry Dana', 'Robert Dana', 'Leo Dangel', 'John Daniel', 'Roy Daniells', 'Jim Daniels', 'Traci Dant', 'Charles Darling', 'Lesley Dauer', 'Sir John Davies', 'William Henry Davies', 'Cortney Davis', 'Dick Davis', 'Jay C. Davis', 'Todd Davis', 'Peter Davison', 'Young Dawkins', 'Clarence Day', 'Lucille Lang Day', 'Mark DeFoe', 'Debra Kang Dean', 'Philip F. Deaver', 'Diane Decillis', 'Thomas Dekker', 'Greg Delanty', 'Alison Hawthorn Deming', 'Alison Hawthorne Deming', 'James DenBoer', 'Edwin Denby', 'Cheryl Denise', 'Reuel Denney', 'Carl Dennis', 'Theodore Deppe', 'Victor Depta', 'Diana Der-Hovanessian', 'Toi Derricotte', 'Bruce Dethlefsen', 'David Devine', 'Kate DiCamillo', 'Charles Dickens', 'James Dickey', 'William Dickey', 'Emily Dickinson', 'Kirsten Dierking', 'Deborah Digges', 'Thomas Disch', 'Stuart Dischell', 'Norita Dittberner-Jax', 'Gregory Djanikian', 'Patricia Dobler', 'Stephen Dobyns', 'Jim Dodge', 'Daniel Donaghy', 'Michael Donaghy', 'Moyra Donaldson', 'John Donne', 'Marilyn Donnelly', 'Susan Donnelly', 'Catherine Doty', 'Mark Doty', 'Keith Douglas', 'Charles Douthat', 'Rita Dove', 'Kim Dower', 'James Doyle', 'Barbara Drake', 'John Dryden', 'Norman Dubie', 'Carol Ann Duffy', 'Denise Duhamel', 'Paul Laurence Dunbar', 'Douglas Dunn', 'Sharon Dunn', 'Stephen Dunn', 'Paul Durcan', 'Mona Van Duyn', 'Edward Dyer', 'Cornelius Eady', 'Richard Eberhart', 'Russell Edson', 'Ralph Edwards', 'W.D. Ehrhart', 'Susan Eisenberg', 'George Eliot', 'T. S. Eliot', 'Harvey Ellis', 'R. Virgil Ellis', 'R. J. Ellmann', 'Lynn Emanuel', 'Claudia Emerson', 'Ralph Waldo Emerson', 'Lynn Emmanuel', 'John Engels', 'John Engman', 'Shirley Ensrud', 'Joseph Enzweiler', 'Ephelia', 'Heid E. Erdrich', 'Louise Erdrich', 'Terri Kirby Erickson', 'Kelly Madigan Erlandson', 'Martin Espada', 'Rhina P. Espaillat', 'Cathryn Essinger', 'Sir George Etherege', 'Dave Etter', 'Peter Everwine', 'Gavin Ewart', 'B. H. Fairchild', 'Robert Fanning', 'Patricia Fargnoli', 'Eleanor Farjeon', 'Annie Farnsworth', 'Frederick Feirstein', 'Irving Feldman', 'James Fenton', 'Sir Samuel Ferguson', 'Lawrence Ferlinghetti', 'Edward Field', 'Eugene Field', 'Rachel Field', 'Eugene Fields', 'Kenneth Fields', 'Darlyn Finch', 'Gary Fincke', 'James Finnegan', 'Susan Firer', 'Catherine Fisher', 'Kevin FitzPatrick', 'Doreen Fitzgerald', 'Nancy Fitzgerald', 'Robert Fitzgerald', 'Michael Flanders', 'Kathleen Flenniken', 'John Fletcher', 'Louisa Fletcher', 'Roland Flint', 'Richard Foerster', 'Robert S. Foote', 'Calvin Forbes', 'Duncan Forbes', 'Thomas Ford', 'Chris Forhan', 'Sam Walter Foss', 'Stephen C. Foster', 'Carrie Fountain', 'Robert Francis', 'Anne Frank', 'G.S. Fraser', 'Nancy Frederiksen', 'Sarah Freligh', 'Elliot Fried', 'Robert Friend', 'Carol Frost', 'Richard Frost', 'Robert Frost', 'Janice Moore Fuller', 'Erica Funkhouser', 'Leah Furnas', 'William Henry Furness', 'Jeannine Hall Gailey', 'Jonathan Galassi', 'Tess Gallagher', 'Brendan Galvin', 'Erica-Lynn Gambino', 'Elizabeth W. Garber', 'Albert Garcia', 'Kim Garcia', 'Isabella Gardner', 'Max Garland', 'George Garrett', 'David Lee Garrison', 'Deborah Garrison', 'Hayden Garruth', 'Sondra Gash', 'Elizabeth Gaskell', 'Carmen Bernos de Gasztold', 'Alfred Scott Gatty', 'Pamela Gemin', 'Jane Gentry', 'Dan Gerber', 'Sonia Gernes', 'James Sloane Gibbons', 'Reginald Gibbons', 'Dobby Gibson', 'Margaret Gibson', 'Jack Gilbert', 'Sandra M. Gilbert', 'W. S. Gilbert', 'Gary Gildner', 'Maria Mazziotti Gillan', 'Laura Gilpin', 'Debra Gingerich', 'Allen Ginsberg', 'Dana Gioia', 'Nikki Giovanni', 'Louise Gluck', 'Patricia Goedicke', 'Douglas Goetsch', 'Albert Goldbarth', 'Barbara Goldberg', 'Midge Goldberg', 'Natalie Goldberg', 'Ellen Goldsmith', 'Leona Gom', 'Ray Gonzalez', 'Jessica Goodfellow', 'Mitchell Goodman', 'Paul Goodman', 'Charles Goodrich', 'Mother Goose', 'Ricky Ian Gordon', 'David Graham', 'Matthew Graham', 'Kenneth Grahame', 'Abigail Gramig', 'George Landsdowne Granville', 'Robert Graves', 'Patricia Gray', 'Sir Alexander Gray', 'Thomas Gray', 'George Green', 'Henry Green', 'Jessica Greenbaum', 'Barbara Greenberg', 'Jonathan Greene', 'John Whittier Greenleaf', 'Jeanie Greensfelder', 'William Greenway', 'Cindy Gregg', 'Linda Gregg', 'Eamon Grennan', 'Jennifer Gresham', 'Kevin Griffith', 'Eliza Griswold', 'Kelle Groom', 'Allen Grossman', 'Jennifer Grotz', 'Paul Groves', 'Edgar A. Guest', 'Ursula Le Guin', 'Arthur Guiterman', 'Keith Gunderson', 'Thom Gunn', 'Ivor Gurney', 'John Guzlowski', 'R. S. Gwynn', 'Beth Gylys', 'John Haag', 'Tami Haaland', 'Marilyn Hacker', 'Ken Hada', 'Rachel Hadas', 'John Haines', 'Sarah Josepha Hale', 'Donald Hall', 'Jim Hall', 'Sharlot Mabridth Hall', 'Mark Halliday', 'Daniel Halpern', 'Barbara Hamby', 'Gerry Hamil', 'Sam Hamill', 'Patricia Hampl', 'W. C. Handy', 'Sophie Hannah', 'Twyla Hansen', 'Phebe Hanson', 'C. G. Hanzlicek', 'C.G. Hanzlicek', 'Jeff Hardin', 'Thomas Hardy', 'William Hargreaves', 'Joy Harjo', 'Edward Harkness', 'William Harmon', 'Michael S. Harper', 'Ann Harrington', 'Marie Harris', 'Jeffrey Harrison', 'Jim Harrison', 'Leslie Harrison', 'Gwen Hart', 'Kenneth Hart', 'Lorenz Hart', 'Charles O. Hartman', 'Julia Hartwig', 'Lola Haskins', 'Robert Bernard Hass', 'Robert Hass', 'Margaret Hasse', 'Linda Hasselstrom', 'Kaylin Haught', 'Hunt Hawkins', 'Beatrice Hawley', 'Robert Hayden', 'Samuel Hazo', 'Seamus Heaney', 'Anthony Hecht', 'Jennifer Michael Hecht', 'Robert Hedin', 'Michael Heffernan', 'Jim Heinen', 'George Held', 'Felicia Dorothea Hemans', 'J. F. Hendry', 'William Ernest Henley', 'Tom Hennen', 'Adrian Henri', 'Adrien Henri', 'Nancy Henry', 'Timrod. Henry', 'A. P. Herbert', 'George Herbert', 'Oliver Hereford', 'David Hernandez', 'Robert Herrick', 'Robert Hershon', 'Greg Hewett', 'Geof Hewitt', 'John Hewitt', 'Bob Hicok', 'Anne Higgins', 'Brenda Hillman', 'Edward Hirsch', 'Jane Hirschfield', 'Jane Hirshfield', 'H. L. Hix', 'Tony Hoagland', 'John Hodgen', 'Samuel Hoffenstein', 'Daniel Hoffman', 'Linda Hogan', 'Phyllis Hoge', 'James Hogg', 'Jonathan Holden', 'John Hollander', 'Bill Holm', 'Janet Holmes', 'Meredith Holmes', 'Oliver Wendell Holmes', 'Garrett Hongo', 'Brian Hooker', 'A. D. Hope', 'Gerard Manley Hopkins', 'Jay Hopler', 'Horace', 'Bernard Horn', 'Sheri Hostetler', 'Paul Hostovsky', 'Judith Hougen', 'A. E. Housman', 'Henry Howard', 'Richard Howard', 'Marie Howe', 'Christopher Howell', 'Barbara Howes', 'Mary Howitt', 'David Huddle', 'Hank Hudepohl', 'Andrew Hudgins', 'Ann Hudson', 'Steven Huff', 'Langston Hughes', 'Pennethorne Hughes', 'Ted Hughes', 'Richard Hugo', 'Carolyn Hull', 'Harry Humes', 'Rolfe Humphries', 'Tom C. Hunley', 'Kathryn Hunt', 'Pearse Hutchinson', 'Lewis Hyde', 'Barbara Helfgott Hyett', 'Shaker Hymn', 'Queen Elizabeth I', 'David Ignatow', 'Mark Irwin', 'Ann Iverson', 'Bessie Jackson', 'Helen Hunt Jackson', 'Marcus Jackson', 'Richard Jackson', 'Susan Jackson', 'Josephine Jacobsen', 'Rolf Jacobsen', 'Lowell Jaeger', 'Catherine Jagoe', 'Clive James', 'Kathleen Jamie', 'Angela Janda', 'Mark Jarman', 'Randall Jarrell', 'Robinson Jeffers', 'Thomas Jefferson', 'Louis Jenkins', 'Elizabeth Jennings', 'Sarah Orne Jewett', 'G.E. Johnson', 'Gary Johnson', 'Jonathan Johnson', 'Peter Johnson', 'Samuel Johnson', 'Betsy Johnson-Miller', 'George Johnston', 'Arlitia Jones', 'Brian Jones', 'Richard Jones', 'Rodney Jones', 'Erica Jong', 'Ben Jonson', 'Barbara Jordan', 'Allison Joseph', 'Jenny Joseph', 'James Joyce', 'Philip E. Burnham, Jr', 'John Gillespie Magee Jr.', 'Roy Blount Jr.', 'Sidney Hall Jr.', 'Ted Thomas Jr.', 'Kasey Jueds', 'Donald Justice', 'Marilyn Kallet', 'Julie Kane', 'Mary Karr', 'Julia Kasdorf', 'Laura Kasischke', 'Bobbi Katz', 'Louise Katz', 'Shirley Kaufman', 'Patrick Kavanagh', 'Meg Kearney', 'John Keats', 'Greg Keeler', 'Garrison Keillor', 'Tina Kelley', 'Brigit Pegeen Kelly', 'Susan Kelly-DeWitt', 'Joyce Kennedy', 'X. J. Kennedy', 'Jane Kenyon', 'David Keplinger', 'T. S. Kerrigan', 'Lawrence Kessenich', 'Stuart Kestenbaum', 'Francis Scott Key', 'David Kherdian', 'John Kieran', 'Athena Kildegaard', 'Franics Kilvert', 'Chungmi Kim', 'James Kimbrell', 'Burt Kimmelman', 'Ben King', 'Rosie King', 'Sara King', 'Susan Deborah King', 'Charles Kingsley', 'Maxine Hong Kingston', 'Galway Kinnell', 'Leland Kinsey', 'Robert Kinsley', 'Rudyard Kipling', 'David Kirby', 'Patricia Kirkpatrick', 'Carolyn Kizer', 'August Kleinzahler', 'William Kloefkorn', 'Kenneth Koch', 'Ron Koertge', 'Ted Kooser', 'Greg Kosmicki', 'Steve Kowit', 'Betty Szold Krainis', 'Aaron Kramer', 'Norbert Krapf', 'Elisabeth Kuhn', 'Maxine Kumin', 'Stanley Kunitz', 'Jaimee Kuperman', 'Greg Kuzma', 'Joanne Kyger', 'Kathryn Kysar', 'Jack LaZebnik', 'Danusha Lameris', 'Danusha Laméris', 'Walter Savage Landor', 'Charlie Langdon', 'Nick Lantz', 'Gary L. Lark', 'Mary Ann Larkin', 'Philip Larkin', 'Cherie Lashway', 'Michael Laskey', 'Peg Lauber', 'James Laughlin', 'Dorianne Laux', 'D. H. Lawrence', 'Robert Lax', 'Irving Layton', 'Naomi Lazard', 'Emma Lazarus', 'Sydney Lea', 'Mary Leader', 'Edward Lear', 'David Lee', 'Li-Young Lee', 'Jay Leeming', 'David Lehman', 'Tom Lehrer', 'Gary Leising', 'Brad Leithauser', 'Bruce Leithauser', 'Hailey Leithauser', 'Eleanor Lerman', 'Denise Levertov', 'Lynn Levin', 'Phillis Levin', 'Miriam Levine', 'Philip Levine', 'Larry Levis', 'Howard Levy', 'C. S. Lewis', 'Janet Lewis', 'Lisa Lewis', 'Dan Liberthson', 'Kate Light', 'Shirley Geok-Lin Lim', 'Abraham Lincoln', 'Michael Lind', 'Anne Morrow Lindbergh', 'April Lindner', 'Kristen Lindquist', 'Frannie Lindsay', 'Vachel Lindsay', 'Romulus Linney', 'Lou Lipsitz', 'Julie Lisella', 'Sara Littlecrow-Russell', 'Roseann Lloyd', 'Gerald Locklin', 'Diane Lockward', 'William Logan', 'Jeanne Lohmann', 'Robert Long', 'Guy W. Longchamps', 'Henry Wadsworth Longfellow', 'Phillip Lopate', 'Joyce Greenberg Lott', 'Amy Lowell', 'James Russell Lowell', 'Robert Lowell', 'Walter Lowenfel', 'Edward Lucie-Smith', 'Susan Ludvigson', 'Krista Lukas', 'Orval Lund', 'Bobbi Lurie', 'Thomas Lux', 'Thomas Lynch', 'Norman MacCaig', 'Marianne MacCuish', 'Archibald MacLeish', 'Louis MacNeice', 'John Macdonald', 'Mary Mackey', 'Elizabeth Macklin', 'Fiona Macleod', 'Naomi Long Madgett', 'Tamara Madison', 'Jennifer Maier', 'Peter Makuck', 'John Maloney', 'Freya Manfred', 'Sarah Manguso', 'Walter De La Mare', 'Edwin Markham', 'Stephanie Marlis', 'Christopher Marlowe', 'Debra Marquart', 'Don Marquis', 'Lisa Martin-Demoor', 'Andrew Marvell', 'John Masefield', 'Donna Masini', 'David Mason', 'Matt Mason', 'Carol Masters', 'Edgar Lee Masters', 'Dan Masterson', 'Suzanne Matson', 'Sebastian Matthews', 'William Matthews', 'Glyn Maxwell', 'Tim Mayo', 'Gail Mazur', 'Bernadette McBride', 'Kevin McCaffrey', 'Linda McCarriston', 'Thomas McCarthy', 'Rebecca McClanahan', 'J.D. McClatchy', 'Tommy McClennan', 'Jeffrey McDaniel', 'Walter McDonald', 'Kilian McDonnell', 'Jo McDougall', 'Mira McEwan', 'Ron McFarland', 'Michael McFee', 'Phyllis McGinley', 'Roger McGough', 'Beth McGrath', 'Thomas McGrath', 'Heather McHugh', 'Joan McIntosh', 'Claude McKay', 'Louis McKee', 'Irene McKinney', 'Sandy McKinney', 'Ted McMahon', 'Richard E. McMullen', 'Wesley McNair', 'Louise McNeill', 'Rennie McQuilkin', 'Wallace McRae', 'Jane Mead', 'Anna George Meek', 'Joshua Mehigan', 'Peter Meinke', 'Herman Melville', 'Johnny Mercer', 'George Meredith', 'William Meredith', 'Eve Merriam', 'James Merrill', 'Robin Merrill', 'Jeredith Merrin', 'W. S. Merwin', 'Corey Mesler', 'Kuno Meyer', 'Robert Mezey', 'David Middleton', 'Michael Milburn', 'Josephine Miles', 'Joseph Millar', 'Edna St. Vincent Millay', 'Carolyn Miller', 'Chuck Miller', 'Sabine Miller', 'Vassar Miller', 'Joseph Mills', 'A. A. Milne', 'Czeslaw Milosz', 'John Milton', 'Susan Minot', 'Adrian Mitchell', 'Joni Mitchell', 'Roger Mitchell', 'Stephen Mitchell', 'Susan Mitchell', 'Wendy Mnookin', 'Thorpe Moeckel', 'N. Scott Momaday', 'Jean Monahan', 'Peter Money', 'Bill Monroe', 'Leslie Monsour', 'Ramon Montaigne', 'Clement Clark Moore', 'Jim Moore', 'Marianne Moore', 'Thomas Moore', 'Thomas R. Moore', 'Michael Moos', 'Pat Mora', 'Michael Moran', 'David Moreau', 'Edwin Morgan', 'Elizabeth Seydel Morgan', 'Frederick Morgan', 'Robert Morgan', 'Robin Morgan', 'Edward Morin', 'Hilda Morley', 'Malena Morling', 'William Morris', 'Dave Morrison', 'Lillian Morrison', 'Howard Moss', 'Travis Mossotti', 'Lisel Mueller', 'Edward Muir', 'Paul Muldoon', 'Rick Mulkey', 'Margaret S. Mullins', 'William Mundell', 'Erin Murphy', 'Christopher Murray', 'Carol Muske', 'Ray Nargis', 'Ogden Nash', 'Leonard Nathan', 'Howard Nelson', 'Marilyn Nelson', 'Howard Nemerov', 'Judi Neri', 'Pablo Neruda', 'Kenn Nesbitt', 'Harry Jr. Newman', 'Richard Newman', 'John Newton', 'Aimee Nezhukumatathil', 'Eric Nixon', 'Yehoshua Nobember', 'Tim Nolan', 'Jean Nordhaus', 'Charles Norman', 'Liane Ellison Norman', 'Nick Norwood', 'Alice Notley', 'William Notter', 'Alden Nowlan', 'Alfred Noyes', 'Naomi Shihab Nye', 'Debra Nystrom', "Julie O'Callaghan", "Mike O'Connor", "Dennis O'Driscoll", "Jennifer O'Grady", "Frank O'Hara", "John O'Keefe", "Arthur O'Shaughnessy", "Leanne O'Sullivan", 'Joyce Catol Oates', 'Ed Ochester', 'Hugh Ogden', 'Rosemary Okun', 'Sharon Olds', 'William Oldys', 'David Oliveira', 'Mary Oliver', 'Michael Ondaatje', 'Peter Oresick', 'Stephen Orlen', 'Steve Orlen', 'John Ormand', 'Eric Ormsby', 'Gregory Orr', 'Thomas Alan Orr', 'Simon J. Ortiz', 'Alicia Suskin Ostriker', 'Alice Oswald', 'Ovid', 'Sue Owen', 'Wilfred Owen', 'Scott Owens', 'Sheila Packa', 'Joe Paddock', 'Ron Padgett', 'Philip Pain', 'Grace Paley', 'Michael Palin', 'Kathe L. Palka', 'Greg Pape', 'Alan Michael Parker', 'Dorothy Parker', 'Elise Partridge', 'Linda Pastan', 'Kenneth Patchen', 'Susie Patlove', 'William B. Patrick', 'G. E. Patterson', 'Veronica Patterson', 'Tom Paxton', 'Thomas Love Peacock', 'Victor W. Pearn', 'Noel Peattie', 'Lynn Pedersen', 'Alison Pelegrin', 'Peter Pereira', 'Mark Perlberg', 'Jack Perlitsky', 'Alice N. Persons', 'Robert Peters', 'Donald Peterson', 'Marc Petrie', 'Paul Petrie', 'Katie Phillips', 'Patrick Phillips', 'Robert Phillips', 'Marge Piercy', 'Katherine Pierpoint', 'Jane Piirto', 'Robert Pinsky', 'Sylvia Plath', 'Stanley Plumly', 'Edgar Allan Poe', 'Thelma Poirier', 'Norah Pollard', 'Katha Pollitt', 'John Pomfret', 'Scott Poole', 'Alexander Pope', 'Deborah Pope', 'Marcia Popp', 'Anne Porter', 'Cole Porter', 'H. H. Porter', 'Pamela Porter', 'Adam Possner', 'Buzz Potter', 'Dawn Potter', 'Jonathan Potter', 'Ezra Pound', 'Dannye Romine Powell', 'Jim Powell', 'Lynn Powell', 'Charles W. Pratt', 'Jack Prelutsky', 'Reynolds Price', 'Wyatt Prunty', 'Sheenagh Pugh', 'Katherine Pyle', 'Monty Python', 'Lawrence Raab', 'T. Cole Rachel', 'Walter Raleigh', 'John Crowe Ransom', 'Barbara Ras', 'Ron Rash', 'David Ray', 'Kay Rayan', 'Liam Rector', 'Victoria Redel', 'Michael Redhill', 'Ishmael Reed', 'James Reeves', 'William Reichard', 'Alastair Reid', 'Christopher Reid', 'John Reinhard', 'James Reiss', 'Naomi Replansky', 'Kenneth Rexroth', 'John Calvin Rezmerski', 'Charles Reznikoff', 'Christine Rhein', 'Brad Ricca', 'Adrienne Rich', 'James Richardson', 'Jack Ridl', 'Kelly-Anne Riess', 'E.V. Rieu', 'James Whitcomb Riley', 'Alberto Rios', 'Dale Ritterbusch', 'Pat Riviere-Seel', 'Doren Robbins', 'Liz Robbins', 'Len Roberts', 'Robin Robertson', 'Eve Robillard', 'Edwin Arlington Robinson', 'Lee Robinson', 'Linda Rodriguez', 'Theodore Roethke', 'James Silas Rogers', 'Pattiann Rogers', 'Beverly Rollwagen', 'Edwin Romond', 'David Romtvedt', 'Leon Rooke', 'Jerry Roscoe', 'Liz Rosenberg', 'David Rosenburg', 'Dante Gabriel Rosetti', 'Charles Henry Ross', 'Christina Rossetti', 'Lee Rudolph', 'Mary Ruefle', 'Muriel Rukeyser', 'Carol Rumens', 'Frazier Russell', 'Kay Ryan', 'Michael Ryan', 'Brad Sachs', 'Charles Sackville', 'Tim Saibles', 'Marjorie Saiser', 'David Salner', 'Mary Jo Salter', 'Carl Sandburg', 'Reg Saner', 'Sherod Santos', 'Robyn Sarah', 'Carmine Sarracino', 'May Sarton', 'Siegfried Sassoon', 'John Godfrey Saxe', 'Steve Scafidi', 'Roy Scheele', 'Jim Schely', 'Peter Schmitt', 'Willa Schneberg', 'Pat Schneider', 'Peter Schneider', 'Ellie Schoenfeld', 'Grace Schulman', 'Philip Schultz', 'Delmore Schwartz', 'Lynne Sharon Schwartz', 'Ruth L. Schwartz', 'John of Amwell Scott', 'Kate Scott', 'Walter Scott', 'Edmund Hamilton Sears', 'Peter Sears', 'Alan Seeger', 'Peter Serchuk', 'Paula Sergi', 'Robert W. Service', 'Vijay Seshadri', 'Vikram Seth', 'Anne Sexton', 'Tom Sexton', 'William Shakespeare', 'Carl Shapiro', 'Harvey Shapiro', 'Brenda Shaw', 'Frances Shaw', 'Luci Shaw', 'Robert B. Shaw', 'Glenn Shea', 'Faith Shearin', 'Julie Sheehan', 'Percy Bysshe Shelley', 'Richard Shelton', 'Jason Shinder', 'Ellie Shoenfeld', 'Betsy Sholl', 'Enid Shomer', 'Jane Shore', 'Gary Short', 'David Shumate', 'Sir Philip Sidney', 'Lawrence Siebert', 'Joan I. Siegel', 'Martha Silano', 'Anya Krugovoy Silver', 'Shel Silverstein', 'Charles Simic', 'Michael Simms', 'Maurya Simon', 'Louis Simpson', 'Hal Sirowitz', 'Daniel Sisco', 'L. E. Sissman', 'Jeffrey Skinner', 'Floyd Skloot', 'Marcia Slatkin', 'William Slaughter', 'David R. Slavitt', 'Deborah Slicer', 'Christopher Smart', 'Charlie Smith', 'Iain Crichton Smith', 'Larry Smith', 'R. T. Smith', 'Stevie Smith', 'Sydney Smith', 'Thomas R. Smith', 'William Jay Smith', 'Elizabeth Smither', 'Frederick Smock', 'W. D. Snodgrass', 'W.D. Snodgrass', 'Gary Snyder', 'Sandy Solomon', 'Cathy Song', 'Old American Song', 'Gary Soto', 'John Philip Sousa', 'Raymond Souster', 'Robert Southey', 'Robert Southwell', 'Barry Spacks', 'Muriel Spark', 'Bernard Spencer', 'Debra Spencer', 'Stephen Spender', 'Edmund Spenser', 'Elizabeth Spires', 'Bruce Springsteen', 'J. C. Squire', 'Kim Stafford', 'William Stafford', 'Mark Stand', 'Ann Stanford', 'John L. Stanizzi', 'Frank L. Stanton', 'Maura Stanton', 'Clemens Starck', 'David Starkey', 'C. K. Stead', 'Timothy Steele', 'Wallace Stegner', 'Gertrude Stein', 'Ellen Steinbaum', 'Martin Steingesser', 'James Stephens', 'Andrew B. Sterling', 'Gerald Stern', 'Charles Stetler', 'C. J. Stevens', 'Elisabeth Stevens', 'Wallace Stevens', 'Anne Stevenson', 'Burton Egbert Stevenson', 'Robert Louis Stevenson', 'Pamela Stewart', 'Joseph Trumbull Stickney', 'Olivia Stiffler', 'Dennis Ward Stiles', 'John Stone', 'Ruth Stone', 'Adrien Stoutenburg', 'William Strafford', 'Steve Straight', 'Mark Strand', 'Joseph Stroud', 'Lucien Stryk', 'Susanna Styve', 'Virgil Suarez', 'Ira Sukrungruang', 'David Allen Sullivan', 'Amber Coverdale Sumrall', 'Joyce Sutphen', 'Barton Sutter', 'Mark Svenvold', 'Ingrid Swanberg', 'David Swanger', 'Robert Sward', 'Chad Sweeney', 'May Swenson', 'Jonathan Swift', 'Algernon Charles Swinburne', 'Wally Swist', 'J. M. Synge', 'Arthur Sze', 'John Tagliabue', 'Deborah Tall', 'Thom Tammaro', 'Jason Tandon', 'Dorothea Tanning', 'Luci Tapahonso', 'James Tate', 'Bruce Taylor', 'Edward Taylor', 'Henry Taylor', 'Jane Taylor', 'Richard Taylor', 'Sara Teasdale', 'Alfred Tennyson', 'William Makepeace Thackeray', 'Hilary Tham', 'Ernest Lawrence Thayer', 'David Thomas', 'Dylan Thomas', 'Edward Thomas', 'Elizabeth Thomas', 'R. S. Thomas', 'Bryan Thompson', 'Penelope Barnes Thompson', 'Sue Ellen Thompson', 'Henry David Thoreau', 'Susan Thurston', 'Elizabeth Tibbetts', 'Francis Orr Ticknor', 'Richard Tillinghast', 'Lenore Keshig Tobias', 'Ruthven Todd', 'Charles Tomlinson', 'Juliette Torrez', 'Parker Towle', 'Wyatt Townley', 'Alison Townsend', 'James Tracy', 'Thomas Traherne', 'Natasha Trethewey', 'John T. Trowbridge', 'William Trowbridge', 'Dennis Trudell', 'David Tucker', 'Catherine Tufariello', 'Mark Turpin', 'Mark Twain', 'Chase Twichell', 'Elizabeth Twiddy', 'Katharine Tynan', 'Leslie Ullman', 'John Updike', 'Louise Vale', 'César Vallejo', 'Katrina Vandenberg', 'Richard Vargas', 'Various', 'Jenifer Rae Vernon', 'Jennifer Rae Vernon', 'Ryan Vine', 'Mark Vinz', 'Paul Violi', 'Judith Viorst', 'Ellen Bryant Voight', 'Ellen Bryant Voigt', 'Jeremy Voigt', 'Shari Wagner', 'David Wagoner', 'Derek Walcott', 'Davi Walders', 'Ronald Wallace', 'Mary Wallach', 'Michael Van Walleghen', 'Michael Walsh', 'Timothy Walsh', 'Izaak Walton', 'Connie Wanek', 'B.J. Ward', 'Thom Ward', 'Belle Waring', 'Emily Warn', 'Robert Penn Warren', 'Rosanna Warren', 'Ellen Waterston', 'Greg Watson', 'Isaac Watts', 'May Thielgaard Watts', 'Tom Wayman', 'Julene Tripp Weaver', 'Charles Harper Webb', 'Arlene Weiner', 'Edward Weismiller', 'Ken Weisner', 'Theodore Weiss', 'Ingrid Wendt', 'Marjory Wentworth', 'Karen Whalley', 'Edith Wharton', 'Phillis Wheatley', 'John Hall Wheelock', 'E. B. White', 'J. P. White', 'Kelley Jean White', 'Gary J. Whitehead', 'Walt Whitman', 'Jason Whitmarsh', 'Reed Whittemore', 'John Greenleaf Whittier', 'David Whyte', 'Anna Wickham', 'Anne Pierson Wiese', 'Richard Wilbur', 'Ella Wheeler Wilcox', 'Oscar Wilde', 'Dana Wildsmith', 'Bruce Willard', 'Nancy Willard', 'C. K. Williams', 'C.K. Williams', 'David Williams', 'Hugo Williams', 'Miller Williams', 'Norman Williams', 'Susan Williams', 'Tennessee Williams', 'William Carlos Williams', 'Greg Williamson', 'Paul J. Willis', 'Terence Winch', 'Catherine Wing', 'Robert Winner', 'Christopher Wiseman', 'Vincent Wixon', 'Roger Woddis', 'Charles Wolfe', 'Marianne Wolfe', 'Cecilia Woloch', 'Girard Woodward', 'Samuel Woodworth', 'Koon Woon', 'William Wordsworth', 'Henry Clay Work', 'Baron Wormser', 'Sir Henry Wotton', 'C. D. Wright', 'Charles Wright', 'Franz Wright', 'James Wright', 'Robert Wrigley', 'Sir Thomas Wyatt', 'Elinor Wylie', 'Mark Yakich', 'William Butler Yeats', 'John Yeoman', 'Al Young', 'Dean Young', 'Gary Young', 'George W. Young', 'Kevin Young', 'Timothy Young', 'Paul Zarisky', 'Bill Zavatsky', 'Alan Ziegler', 'Paul Zimmer', 'Al Zolynas', 'Various famous headstones', 'American folk song'];

export default App;
