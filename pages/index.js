import Image from "next/image";

function Home() {
  return (
    <div>
      <h1>Opa 👋 !!!!</h1>
      <Image
        src="/happy-back-to-school.gif"
        alt="Happy Back to School"
        width={500}
        height={300}
      />
    </div>
  );
}

export default Home;
