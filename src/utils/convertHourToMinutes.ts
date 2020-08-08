export default function convertHourToMinutes(time: string) {
  // 8:00
  // .map(Number) -> pega cada item do array e transforma em numero
  const [hours, minutes] = time.split(':').map(Number);
  const timeInMinutes = hours * 60 + minutes;
  return timeInMinutes;
}
