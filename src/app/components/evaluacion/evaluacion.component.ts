import { Component, OnInit, HostListener, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

interface Question {
  id: number;
  text: string;
  options: string[];
  correctAnswer: number;
  type: 'teoria' | 'ejercicio';
}

@Component({
  selector: 'app-evaluacion',
  templateUrl: './evaluacion.component.html',
  styleUrls: ['./evaluacion.component.css']
})
export class EvaluacionComponent implements OnInit, OnDestroy {
  taller: string = '';
  questions: Question[] = [];
  currentQuestionIndex: number = 0;
  score: number = 0;
  hasStarted: boolean = false;
  isFinished: boolean = false;
  
  // Timer
  timeLeft: number = 0;
  timerInterval: any;

  // Anti-cheat
  tabSwitches: number = 0;
  maxTabSwitches: number = 3;

  // Results
  studentEmail: string = '';
  passed: boolean = false;
  previousScore: number | null = null;
  
  // Modals/Warnings
  showWarning: boolean = false;
  warningMessage: string = '';

  constructor(private route: ActivatedRoute, private router: Router) { }

  ngOnInit(): void {
    this.taller = this.route.snapshot.paramMap.get('taller') || '';
    this.studentEmail = localStorage.getItem('userEmail') || 'estudiante@correo.com';
    
    // Check if already taken
    const existingResult = localStorage.getItem(`eval_${this.taller}_${this.studentEmail}`);
    if (existingResult) {
      this.previousScore = JSON.parse(existingResult).score;
      this.passed = JSON.parse(existingResult).passed;
      this.isFinished = true;
    }

    this.loadQuestions();
  }

  ngOnDestroy(): void {
    this.clearTimer();
  }

  @HostListener('document:visibilitychange', ['$event'])
  onVisibilityChange(event: Event) {
    if (this.hasStarted && !this.isFinished && document.hidden) {
      this.tabSwitches++;
      if (this.tabSwitches >= this.maxTabSwitches) {
        this.finishEvaluation(true); // Forte fail
      } else {
        this.showWarning = true;
        this.warningMessage = `¡Advertencia! Has cambiado de pestaña. Tienes ${this.maxTabSwitches - this.tabSwitches} oportunidad(es) más antes de anular la evaluación.`;
      }
    }
  }

  loadQuestions(): void {
    if (this.taller === 'mua') {
      this.questions = this.getMuaQuestions();
    } else if (this.taller === 'caida-libre') {
      this.questions = this.getCaidaLibreQuestions();
    } else if (this.taller === 'tiro-parabolico') {
      this.questions = this.getTiroParabolicoQuestions();
    } else {
      this.router.navigate(['/dashboard']);
    }
    
    // Shuffle questions
    this.questions.sort(() => Math.random() - 0.5);
  }

  startEvaluation(): void {
    this.hasStarted = true;
    this.currentQuestionIndex = 0;
    this.score = 0;
    this.tabSwitches = 0;
    this.showWarning = false;
    this.startTimerForCurrentQuestion();
  }

  startTimerForCurrentQuestion(): void {
    this.clearTimer();
    const currentQ = this.questions[this.currentQuestionIndex];
    this.timeLeft = currentQ.type === 'teoria' ? 60 : 90;
    
    this.timerInterval = setInterval(() => {
      this.timeLeft--;
      if (this.timeLeft <= 0) {
        this.clearTimer();
        this.nextQuestion(null); // Time's up, incorrect answer
      }
    }, 1000);
  }

  clearTimer(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
  }

  selectOption(optionIndex: number | null): void {
    this.clearTimer();
    if (optionIndex !== null && optionIndex === this.questions[this.currentQuestionIndex].correctAnswer) {
      this.score++;
    }
    
    setTimeout(() => {
      this.nextQuestion(optionIndex);
    }, 500); // Pequeño retraso para ver la selección (opcional)
  }

  nextQuestion(optionIndex: number | null): void {
    if (this.currentQuestionIndex < this.questions.length - 1) {
      this.currentQuestionIndex++;
      this.startTimerForCurrentQuestion();
    } else {
      this.finishEvaluation();
    }
  }

  finishEvaluation(forced: boolean = false): void {
    this.clearTimer();
    this.isFinished = true;
    
    if (forced) {
      this.score = 0; // Penalización por trampa
      this.warningMessage = "Evaluación anulada por exceso de cambios de pestaña.";
    }

    const percentage = (this.score / this.questions.length) * 100;
    this.passed = percentage >= 70;

    // Save to localStorage
    const result = {
      score: this.score,
      total: this.questions.length,
      passed: this.passed,
      date: new Date().toISOString()
    };
    localStorage.setItem(`eval_${this.taller}_${this.studentEmail}`, JSON.stringify(result));
    this.previousScore = this.score;
  }

  closeWarning(): void {
    this.showWarning = false;
  }

  goBack(): void {
    this.router.navigate([`/talleres/${this.taller}`]);
  }

  get formattedTime(): string {
    const m = Math.floor(this.timeLeft / 60);
    const s = this.timeLeft % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  downloadImage(): void {
    const element = document.querySelector('.eval-results') as HTMLElement;
    if (element) {
      // Ocultar botones temporalmente para no incluirlos en la captura
      const actionButtons = document.querySelector('.action-buttons') as HTMLElement;
      if (actionButtons) actionButtons.style.display = 'none';

      // Añadir clase temporal para diseño de certificado claro y bonito
      element.classList.add('certificate-export');

      // Pequeño delay para asegurar que el DOM aplicó la clase antes de capturar
      setTimeout(() => {
        html2canvas(element, { backgroundColor: '#ffffff', scale: 2, logging: false }).then(canvas => {
          element.classList.remove('certificate-export');
          if (actionButtons) actionButtons.style.display = 'flex';
          const link = document.createElement('a');
          link.download = `Certificado_${this.getWorkshopName()}_${this.studentEmail}.png`;
          link.href = canvas.toDataURL();
          link.click();
        });
      }, 100);
    }
  }

  downloadPDF(): void {
    const element = document.querySelector('.eval-results') as HTMLElement;
    if (element) {
      // Ocultar botones temporalmente para no incluirlos en la captura
      const actionButtons = document.querySelector('.action-buttons') as HTMLElement;
      if (actionButtons) actionButtons.style.display = 'none';

      // Añadir clase temporal para diseño de certificado
      element.classList.add('certificate-export');

      setTimeout(() => {
        html2canvas(element, { backgroundColor: '#ffffff', scale: 2, logging: false }).then(canvas => {
          element.classList.remove('certificate-export');
          if (actionButtons) actionButtons.style.display = 'flex';
          
          const imgData = canvas.toDataURL('image/png');
          const pdf = new jsPDF('p', 'mm', 'a4');
          const pdfWidth = pdf.internal.pageSize.getWidth();
          // Calculamos la altura proporcional para evitar estiramientos
          const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
          
          pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
          pdf.save(`Certificado_${this.getWorkshopName()}_${this.studentEmail}.pdf`);
        });
      }, 100);
    }
  }

  public getWorkshopName(): string {
    if (this.taller === 'mua') return 'Movimiento Uniforme Acelerado';
    if (this.taller === 'caida-libre') return 'Caída Libre';
    if (this.taller === 'tiro-parabolico') return 'Tiro Parabólico';
    return '';
  }

  // --- DATA: 20 PREGUNTAS MUA ---
  private getMuaQuestions(): Question[] {
    return [
      { id: 1, type: 'teoria', text: '¿Qué característica define principalmente al Movimiento Uniforme Acelerado (MUA)?', options: ['Velocidad constante', 'Aceleración constante y distinta de cero', 'Aceleración nula', 'Desplazamiento constante'], correctAnswer: 1 },
      { id: 2, type: 'teoria', text: 'En la gráfica de Velocidad vs. Tiempo de un MUA, ¿cuál es la forma de la línea?', options: ['Una parábola', 'Una línea recta horizontal', 'Una línea recta con pendiente no nula', 'Una curva exponencial'], correctAnswer: 2 },
      { id: 3, type: 'teoria', text: 'Si un objeto tiene aceleración negativa y velocidad positiva, significa que:', options: ['Está acelerando hacia atrás', 'Está frenando', 'Está detenido', 'Mantiene velocidad constante'], correctAnswer: 1 },
      { id: 4, type: 'teoria', text: '¿Qué representa el área bajo la curva en un gráfico de Velocidad vs. Tiempo?', options: ['La aceleración', 'La distancia recorrida (desplazamiento)', 'El cambio de aceleración', 'La fuerza aplicada'], correctAnswer: 1 },
      { id: 5, type: 'teoria', text: 'En la educación sobre cinemática, Galileo fue el pionero en demostrar que:', options: ['Las fuerzas causan movimiento', 'La distancia es proporcional al cuadrado del tiempo en aceleración constante', 'Los objetos más pesados caen más rápido', 'La velocidad siempre es relativa'], correctAnswer: 1 },
      { id: 6, type: 'teoria', text: '¿Cuál es la fórmula para la posición (x) en función del tiempo en MUA?', options: ['x = x₀ + v·t', 'x = x₀ + v₀·t + ½a·t²', 'x = v₀ + a·t', 'x = ½v·t²'], correctAnswer: 1 },
      { id: 7, type: 'teoria', text: 'Si parte del reposo, un auto tiene una velocidad inicial (v₀) de:', options: ['Depende de la aceleración', '9.8 m/s', '0 m/s', '1 m/s'], correctAnswer: 2 },
      { id: 8, type: 'teoria', text: 'La ecuación v² = v₀² + 2aΔx es útil cuando no se conoce:', options: ['La aceleración', 'La velocidad inicial', 'La distancia', 'El tiempo'], correctAnswer: 3 },
      { id: 9, type: 'teoria', text: '¿Cuáles son las unidades del Sistema Internacional (SI) para la aceleración?', options: ['m/s', 'm/s²', 'N/m', 'Km/h'], correctAnswer: 1 },
      { id: 10, type: 'teoria', text: '¿Qué ocurre con la distancia recorrida en intervalos de tiempo iguales durante un MUA?', options: ['Es constante', 'Aumenta en la misma proporción que el tiempo', 'Aumenta cuadráticamente', 'Disminuye con el tiempo'], correctAnswer: 2 },
      { id: 11, type: 'ejercicio', text: 'Un automóvil parte del reposo y acelera a razón de 4 m/s². ¿Cuál será su velocidad a los 5 segundos?', options: ['10 m/s', '20 m/s', '40 m/s', '9 m/s'], correctAnswer: 1 },
      { id: 12, type: 'ejercicio', text: 'Un tren que viaja a 30 m/s frena con una desaceleración de -3 m/s². ¿Cuánto tiempo tarda en detenerse?', options: ['5 s', '10 s', '15 s', '30 s'], correctAnswer: 1 },
      { id: 13, type: 'ejercicio', text: 'Un ciclista parte del reposo y acelera a 2 m/s² durante 4 segundos. ¿Qué distancia recorre?', options: ['8 m', '16 m', '32 m', '4 m'], correctAnswer: 1 },
      { id: 14, type: 'ejercicio', text: 'Un móvil que parte del reposo alcanza 20 m/s en 10 s. Su aceleración fue:', options: ['2 m/s²', '0.5 m/s²', '200 m/s²', '10 m/s²'], correctAnswer: 0 },
      { id: 15, type: 'ejercicio', text: '¿Qué velocidad inicial tenía un objeto si tras acelerar a 3 m/s² durante 4s alcanzó los 15 m/s?', options: ['0 m/s', '3 m/s', '12 m/s', '27 m/s'], correctAnswer: 1 },
      { id: 16, type: 'ejercicio', text: 'Se usan los frenos en un auto a 20 m/s, deteniéndose tras recorrer 40 m. ¿Cuál fue su aceleración?', options: ['-2 m/s²', '-4 m/s²', '-5 m/s²', '-10 m/s²'], correctAnswer: 2 },
      { id: 17, type: 'ejercicio', text: 'Un cuerpo parte del reposo. En el instante t=2s su posición es 10m. ¿Cuál es su aceleración?', options: ['2.5 m/s²', '5 m/s²', '10 m/s²', '20 m/s²'], correctAnswer: 1 },
      { id: 18, type: 'ejercicio', text: 'Convierte una aceleración de 36 (km/h)/s a m/s²:', options: ['100 m/s²', '10 m/s²', '3600 m/s²', '3.6 m/s²'], correctAnswer: 1 },
      { id: 19, type: 'ejercicio', text: 'Un avión requiere 60 m/s para despegar. Si su aceleración es 3 m/s², ¿qué distancia de pista necesita si parte del reposo?', options: ['300 m', '600 m', '1200 m', '180 m'], correctAnswer: 1 },
      { id: 20, type: 'ejercicio', text: 'Una particular mantiene 5 m/s² y se desplaza 50 m. Su velocidad final, partiendo del reposo, será:', options: ['10 m/s', '22.36 m/s (√500)', '500 m/s', '25 m/s'], correctAnswer: 1 }
    ];
  }

  // --- DATA: 20 PREGUNTAS CAÍDA LIBRE ---
  private getCaidaLibreQuestions(): Question[] {
    return [
      { id: 1, type: 'teoria', text: 'En caída libre, ignorando la resistencia del aire, la aceleración de un objeto:', options: ['Aumenta conforme cae', 'Disminuye conforme cae', 'Se mantiene constante', 'Depende de su masa'], correctAnswer: 2 },
      { id: 2, type: 'teoria', text: 'El valor estándar de la gravedad (g) en la superficie de la Tierra es aproximadamente:', options: ['9.8 m/s', '9.8 m/s²', '10 km/h', '9.8 cm/s²'], correctAnswer: 1 },
      { id: 3, type: 'teoria', text: 'Si se dejan caer al vacío una bola de plomo y una pluma desde la misma altura:', options: ['La bola de plomo llega primero', 'La pluma llega primero', 'Ambas llegan al mismo tiempo', 'Ninguna llega al suelo'], correctAnswer: 2 },
      { id: 4, type: 'teoria', text: 'La velocidad de un objeto soltado desde el reposo en caída libre en el instante t=0 es:', options: ['9.8 m/s', 'Infinita', '0 m/s', 'Desconocida'], correctAnswer: 2 },
      { id: 5, type: 'teoria', text: 'Durante la subida de un objeto lanzado verticalmente hacia arriba, la gravedad:', options: ['Acelera el objeto hacia arriba', 'Desacelera el objeto (actúa hacia abajo)', 'Es cero hasta llegar al punto máximo', 'Se invierte'], correctAnswer: 1 },
      { id: 6, type: 'teoria', text: 'En el punto de altura máxima de un lanzamiento vertical, la velocidad del objeto es:', options: ['9.8 m/s', 'Máxima', '0 m/s', 'Depende del peso'], correctAnswer: 2 },
      { id: 7, type: 'teoria', text: 'En el punto de altura máxima, la aceleración del objeto es:', options: ['0 m/s²', '9.8 m/s² hacia abajo', '9.8 m/s² hacia arriba', '-19.6 m/s²'], correctAnswer: 1 },
      { id: 8, type: 'teoria', text: 'La ecuación para calcular la distancia de caída partiendo del reposo es:', options: ['y = g·t', 'y = ½·g·t²', 'y = 2·g·t', 'y = (g·t)²'], correctAnswer: 1 },
      { id: 9, type: 'teoria', text: 'La "velocidad terminal" se alcanza debido a:', options: ['La fuerza de gravedad', 'La resistencia del aire igualando al peso del objeto', 'La pérdida de masa', 'La distancia al centro de la tierra'], correctAnswer: 1 },
      { id: 10, type: 'teoria', text: 'La aceleración de gravedad en la Luna comparada con la Tierra es aproximadamente:', options: ['Un sexto (1/6)', 'El doble', 'La mitad', 'Igual'], correctAnswer: 0 },
      { id: 11, type: 'ejercicio', text: 'Se deja caer una piedra desde un puente. Tarda 3 segundos en llegar al agua. ¿Cuál es su velocidad al impactar? (Usar g=9.8 m/s²)', options: ['14.7 m/s', '29.4 m/s', '44.1 m/s', '9.8 m/s'], correctAnswer: 1 },
      { id: 12, type: 'ejercicio', text: 'Teniendo en cuenta la pregunta anterior, ¿qué altura tiene el puente?', options: ['44.1 m', '29.4 m', '88.2 m', '14.7 m'], correctAnswer: 0 },
      { id: 13, type: 'ejercicio', text: 'Se lanza una pelota hacia arriba a 19.6 m/s. ¿Cuánto tiempo tarda en alcanzar su altura máxima? (g=9.8 m/s²)', options: ['1 s', '2 s', '4 s', '19.6 s'], correctAnswer: 1 },
      { id: 14, type: 'ejercicio', text: '¿Qué altura máxima alcanzará la pelota de la pregunta anterior?', options: ['9.8 m', '19.6 m', '39.2 m', '0 m'], correctAnswer: 1 },
      { id: 15, type: 'ejercicio', text: 'Un ladrillo es soltado desde 80 metros de altura. Aproximadamente, ¿cuánto tiempo tarda en caer al suelo? (Use g=10 m/s² para simplificar)', options: ['4 s', '8 s', '16 s', '2 s'], correctAnswer: 0 },
      { id: 16, type: 'ejercicio', text: 'Una llave cae desde una ventana y llega al piso a 40 m/s. (Usar g=10 m/s²). ¿Desde qué altura cayó?', options: ['40 m', '80 m', '160 m', '20 m'], correctAnswer: 1 },
      { id: 17, type: 'ejercicio', text: 'Un proyectil es disparado verticalmente y permanece en el aire por 10 s (subida y bajada). ¿Con qué velocidad fue lanzado? (Use g=9.8 m/s²)', options: ['98 m/s', '49 m/s', '19.6 m/s', '0 m/s'], correctAnswer: 1 },
      { id: 18, type: 'ejercicio', text: 'Dejamos caer un celular. En el primer segundo recorre d1 metros, y en el segundo instante de t=1 a t=2 recorre d2. ¿Cuál es la relación?', options: ['d2 = d1', 'd2 = 2 × d1', 'd2 = 3 × d1', 'd2 = 4 × d1'], correctAnswer: 2 },
      { id: 19, type: 'ejercicio', text: 'Un paracaidista en caída libre, antes de alcanzar velocidad terminal, recorre cierta distancia. Si duplica el tiempo de caída libre, la distancia:', options: ['Se duplica', 'Se cuadruplica (aumenta 4 veces)', 'Se triplica', 'Permanece igual'], correctAnswer: 1 },
      { id: 20, type: 'ejercicio', text: 'Con v₀=0, después de caer 20 metros la velocidad de la piedra (g=10m/s²) es:', options: ['10 m/s', '20 m/s', '40 m/s', '200 m/s'], correctAnswer: 1 }
    ];
  }

  // --- DATA: 20 PREGUNTAS TIRO PARABÓLICO ---
  private getTiroParabolicoQuestions(): Question[] {
    return [
      { id: 1, type: 'teoria', text: 'El movimiento proyectil (parabólico) es el resultado de la combinación de:', options: ['MRU en X y MUA en Y', 'MUA en X y MRU en Y', 'MRU en ambos ejes', 'MUA en ambos ejes'], correctAnswer: 0 },
      { id: 2, type: 'teoria', text: 'En la componente horizontal (eje X) del tiro parabólico ideal, la velocidad:', options: ['Aumenta continuamente', 'Disminuye progresivamente', 'Permanece constante', 'Es cero'], correctAnswer: 2 },
      { id: 3, type: 'teoria', text: 'En el punto de máxima altura de un tiro parabólico, la velocidad vertical (Vy) es:', options: ['Máxima', '9.8 m/s', 'Cero', 'Igual a la velocidad horizontal'], correctAnswer: 2 },
      { id: 4, type: 'teoria', text: 'Para maximizar el alcance horizontal (R) sin resistencia de aire, el objeto debe lanzarse con un ángulo de:', options: ['30°', '45°', '60°', '90°'], correctAnswer: 1 },
      { id: 5, type: 'teoria', text: 'Lanzando proyectiles con la misma velocidad inicial, ¿qué pares de ángulos logran el mismo alcance horizontal?', options: ['Ángulos que sumen 90° (complementarios)', 'Ángulos que sumen 180°', 'Pares idénticos únicamente', 'Cualquier par distinto logran alcances distintos'], correctAnswer: 0 },
      { id: 6, type: 'teoria', text: 'En el punto más alto de la trayectoria parabólica, la aceleración del proyectil es:', options: ['Cero', 'g hacia abajo', 'g horizontal', 'Menor que g'], correctAnswer: 1 },
      { id: 7, type: 'teoria', text: 'Si un avión en vuelo horizontal constante deja caer un paquete, ¿qué trayectoria observa un pasajero en el avión?', options: ['Parabólica hacia atrás', 'Caída libre vertical recta', 'Parabólica hacia adelante', 'Diagonal'], correctAnswer: 1 },
      { id: 8, type: 'teoria', text: 'Y desde la Tierra, un observador en reposo ve la trayectoria de este mismo paquete como:', options: ['Caída libre vertical recta', 'Una parábola', 'Una línea horizontal', 'Un círculo'], correctAnswer: 1 },
      { id: 9, type: 'teoria', text: 'La velocidad descompuesta en sus ejes al inicio se calcula usando (respectivamente a X e Y):', options: ['senθ y cosθ', 'cosθ y senθ', 'tanθ y cosθ', 'senθ y tanθ'], correctAnswer: 1 },
      { id: 10, type: 'teoria', text: 'El tiempo total de vuelo del proyectil, si regresa al nivel del suelo de donde partió, depende de:', options: ['La masa del proyectil', 'Solo la velocidad inicial en X', 'La velocidad inicial en Y', 'La temperatura del aire'], correctAnswer: 2 },
      { id: 11, type: 'ejercicio', text: 'Se dispara un cañón a 100 m/s bajo un ángulo de 30°. ¿Cuál es su componente inicial vertical (Vy₀)? (sen30°=0.5)', options: ['86.6 m/s', '50 m/s', '100 m/s', '0 m/s'], correctAnswer: 1 },
      { id: 12, type: 'ejercicio', text: 'Siguiendo el problema anterior, ¿cuál es el tiempo para alcanzar la máxima altura? (g=10m/s²)', options: ['2.5 s', '5 s', '10 s', '15 s'], correctAnswer: 1 },
      { id: 13, type: 'ejercicio', text: '¿Y el tiempo total de vuelo de dicho cañonazo antes de impactar el llano?', options: ['5 s', '10 s', '20 s', '8.66 s'], correctAnswer: 1 },
      { id: 14, type: 'ejercicio', text: 'Se dispara un balón horizontalmente de un techo a 20 m de altura, con v₀ = 15 m/s. Tiempo en caer? (Use g=10m/s²)', options: ['2 s', '4 s', '1.5 s', '10 s'], correctAnswer: 0 },
      { id: 15, type: 'ejercicio', text: 'En la situación anterior, ¿a qué distancia horizontal (alcance) tocará el suelo?', options: ['15 m', '30 m', '45 m', '20 m'], correctAnswer: 1 },
      { id: 16, type: 'ejercicio', text: 'Se lanza un dardo a 5 m/s, ángulo 45°. El alcance máximo es R = (v₀²·sen(2θ))/g. Sabiendo sen(90°)=1 y g=10m/s², R es:', options: ['5 m', '2.5 m', '1 m', '0 m'], correctAnswer: 1 },
      { id: 17, type: 'ejercicio', text: 'Si lanzamos el mismo dardo con 60°, su alcance será el mismo que si lo lanzáramos a:', options: ['20°', '30°', '45°', 'Ninguno'], correctAnswer: 1 },
      { id: 18, type: 'ejercicio', text: 'Una pelota de béisbol vuela por 6s. El tiempo para llegar al pico es 3s. Si g=10m/s², su componente Vy inicial era:', options: ['15 m/s', '30 m/s', '60 m/s', '300 m/s'], correctAnswer: 1 },
      { id: 19, type: 'ejercicio', text: 'Si la Vx es 20 m/s en la pregunta anterior, y estuvo en aire 6s, ¿cuánto recorrió horizontalmente?', options: ['60 m', '80 m', '120 m', '240 m'], correctAnswer: 2 },
      { id: 20, type: 'ejercicio', text: '¿A qué velocidad en X viaja un móvil lanzado con V₀ = 50 m/s a un ángulo de 60°? (cos 60° = 0.5)', options: ['25 m/s', '43.3 m/s', '50 m/s', '0 m/s'], correctAnswer: 0 }
    ];
  }

}
