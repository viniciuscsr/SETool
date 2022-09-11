import './HomeCard.css';

export default function HomeCard({ src, heading, text, buttonCta }) {
  return (
    <div className='col text-center p-5'>
      {/* <img src={src} /> */}
      <h2>{heading}</h2>
      <p>{text}</p>
      <button className='btn btn-success'>{buttonCta}</button>
    </div>
  );
}