import { Brand } from "./Brand";

/** Site footer on every page: card-art and text credits. */
export default function Footer() {
  return (
    <footer className="footer">
      <Brand />
      <div className="footer-text">
        <p>
          ภาพไพ่: Pamela Colman Smith (1909) สาธารณสมบัติ · ความหมายไพ่: A. E. Waite, <i>The Pictorial Key to the Tarot</i> (1910)
        </p>
        <p>คำทำนายตีความโดย AI เพื่อความบันเทิงและเป็นแนวทางในการไตร่ตรอง โปรดใช้วิจารณญาณ</p>
      </div>
    </footer>
  );
}
