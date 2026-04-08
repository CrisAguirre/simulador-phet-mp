import { Component, OnDestroy, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { Router } from '@angular/router';

interface ConceptCard { icon: string; title: string; description: string; }
interface FormulaItem { label: string; formula: string; meaning: string; }
interface ActivityStep { step: number; instruction: string; question: string; }

@Component({
  selector: 'app-caida-libre',
  templateUrl: './caida-libre.component.html',
  styleUrls: ['./caida-libre.component.css']
})
export class CaidaLibreComponent implements OnDestroy, AfterViewInit {
  @ViewChild('simCanvas', { static: false }) canvasRef!: ElementRef<HTMLCanvasElement>;

  activeSection: string = 'teoria';
  expandedFormula: number = -1;

  // Simulator
  simMode: 'caida' | 'lanzamiento' = 'caida';
  initialHeight: number = 80;
  initialVelocity: number = 20;
  gravityPreset: string = 'tierra';
  gravity: number = 9.8;
  isRunning: boolean = false;
  simTime: number = 0;
  currentHeight: number = 80;
  currentVelocity: number = 0;
  hasLanded: boolean = false;
  private animFrameId: number = 0;
  private lastTimestamp: number = 0;
  private trail: { y: number; t: number }[] = [];

  gravityOptions = [
    { label: 'Tierra', value: 9.8, key: 'tierra', icon: '🌍' },
    { label: 'Luna', value: 1.62, key: 'luna', icon: '🌙' },
    { label: 'Marte', value: 3.72, key: 'marte', icon: '🔴' },
    { label: 'Júpiter', value: 24.79, key: 'jupiter', icon: '🟠' }
  ];

  concepts: ConceptCard[] = [
    {
      icon: '🍎',
      title: 'Sin velocidad inicial',
      description: 'En la caída libre pura, el objeto se suelta desde el reposo (v₀ = 0). La única fuerza que actúa es la gravedad, que lo acelera hacia abajo de forma constante.'
    },
    {
      icon: '⚖️',
      title: 'Independiente de la masa',
      description: 'En ausencia de aire, todos los objetos caen con la misma aceleración, sin importar su masa. Una pluma y un martillo caen igual en el vacío, como se demostró en la Luna.'
    },
    {
      icon: '📉',
      title: 'Aceleración gravitacional',
      description: 'En la Tierra, g ≈ 9.8 m/s². Esto significa que cada segundo que pasa, la velocidad del objeto aumenta en 9.8 m/s. Es un caso especial del MRUV.'
    },
    {
      icon: '⏱️',
      title: 'El tiempo lo es todo',
      description: 'La distancia recorrida crece con el cuadrado del tiempo: en 1s cae 4.9m, en 2s cae 19.6m, en 3s cae 44.1m. ¡Cada segundo cae mucho más que el anterior!'
    }
  ];

  formulas: FormulaItem[] = [
    {
      label: 'Velocidad',
      formula: 'v = g · t',
      meaning: 'La velocidad del objeto en caída libre es directamente proporcional al tiempo. A los 3 segundos en la Tierra: v = 9.8 × 3 = 29.4 m/s.'
    },
    {
      label: 'Distancia caída',
      formula: 'y = ½ · g · t²',
      meaning: 'La distancia que recorre el objeto crece con el cuadrado del tiempo. Por eso los primeros metros son lentos y luego cae cada vez más rápido.'
    },
    {
      label: 'Velocidad sin tiempo',
      formula: 'v² = 2 · g · h',
      meaning: 'Permite calcular la velocidad al llegar al suelo conociendo solo la altura desde donde se soltó, sin necesidad de conocer el tiempo de caída.'
    },
    {
      label: 'Tiempo de caída',
      formula: 't = √(2h / g)',
      meaning: 'El tiempo que tarda un objeto en llegar al suelo depende de la altura y la gravedad. Desde 20m en la Tierra: t = √(40/9.8) ≈ 2.02 s.'
    },
    {
      label: 'Altura restante',
      formula: 'h(t) = h₀ − ½ · g · t²',
      meaning: 'La altura del objeto en cualquier instante es la altura inicial menos la distancia que ya ha caído.'
    }
  ];

  activities: ActivityStep[] = [
    {
      step: 1,
      instruction: 'Configura la altura en 50 metros y selecciona gravedad "Tierra". Presiona "Soltar" y observa la caída.',
      question: '¿Cuánto tiempo tarda el objeto en llegar al suelo? Compara con el cálculo teórico: t = √(2×50/9.8).'
    },
    {
      step: 2,
      instruction: 'Sin cambiar la altura (50m), prueba con las cuatro gravedades disponibles: Tierra, Luna, Marte y Júpiter.',
      question: '¿En cuál planeta cae más rápido? ¿Y más lento? ¿Cuántas veces más tarda en la Luna comparado con la Tierra?'
    },
    {
      step: 3,
      instruction: 'Con gravedad de la Tierra, prueba 3 alturas diferentes: 20m, 50m y 100m. Anota el tiempo de caída y la velocidad final.',
      question: 'Si duplicas la altura, ¿se duplica el tiempo de caída? ¿Se duplica la velocidad final? Explica por qué.'
    },
    {
      step: 4,
      instruction: 'Configura una altura de 80m en la Tierra. Antes de soltar, calcula con lápiz y papel: el tiempo de caída y la velocidad al llegar al suelo.',
      question: 'Compara tus cálculos con los resultados del simulador. ¿Coinciden? Si hay diferencia, ¿a qué se debe?'
    },
    {
      step: 5,
      instruction: 'Observa el rastro de posiciones (puntos) que deja el objeto al caer. Nota cómo la separación entre los puntos cambia.',
      question: '¿Por qué los puntos están más separados al final del recorrido que al inicio? Relaciona esto con la aceleración.'
    }
  ];

  constructor(private router: Router) {}

  ngAfterViewInit(): void {}

  ngOnDestroy(): void {
    if (this.animFrameId) cancelAnimationFrame(this.animFrameId);
  }

  goBack(): void { this.router.navigate(['/dashboard']); }

  goToEvaluacion(): void {
    this.router.navigate(['/talleres/caida-libre/evaluacion']);
  }

  setSection(section: string): void {
    this.activeSection = section;
    if (section === 'simulador') {
      this.resetSimulation();
      setTimeout(() => this.drawScene(), 50);
    }
  }

  toggleFormula(index: number): void {
    this.expandedFormula = this.expandedFormula === index ? -1 : index;
  }

  setGravity(key: string): void {
    if (this.isRunning) return;
    this.gravityPreset = key;
    const opt = this.gravityOptions.find(o => o.key === key);
    if (opt) this.gravity = opt.value;
    this.resetSimulation();
  }

  setMode(mode: 'caida' | 'lanzamiento'): void {
    if (this.isRunning) return;
    this.simMode = mode;
    if (mode === 'lanzamiento' && this.initialHeight > 50) {
      this.initialHeight = 0; // Usually launch from ground
    } else if (mode === 'caida' && this.initialHeight === 0) {
      this.initialHeight = 80;
    }
    this.resetSimulation();
  }

  startSimulation(): void {
    if (this.isRunning || this.hasLanded) return;
    this.isRunning = true;
    this.currentHeight = this.initialHeight;
    this.currentVelocity = 0;
    this.simTime = 0;
    this.trail = [];
    this.hasLanded = false;
    this.lastTimestamp = performance.now();
    this.animFrameId = requestAnimationFrame((ts) => this.animate(ts));
  }

  resetSimulation(): void {
    this.isRunning = false;
    if (this.animFrameId) cancelAnimationFrame(this.animFrameId);
    this.simTime = 0;
    this.currentHeight = this.initialHeight;
    this.currentVelocity = 0;
    this.hasLanded = false;
    this.trail = [];
    setTimeout(() => this.drawScene(), 20);
  }

  private animate(timestamp: number): void {
    if (!this.isRunning) return;
    const dt = Math.min((timestamp - this.lastTimestamp) / 1000, 0.05);
    this.lastTimestamp = timestamp;
    this.simTime += dt;

    const v0 = this.simMode === 'caida' ? 0 : this.initialVelocity;
    this.currentVelocity = v0 - this.gravity * this.simTime; // Positive = up, Negative = down
    this.currentHeight = this.initialHeight + (v0 * this.simTime) - (0.5 * this.gravity * this.simTime * this.simTime);

    this.trail.push({ y: this.currentHeight, t: this.simTime });

    if (this.currentHeight <= 0 && this.simTime > 0) {
      this.currentHeight = 0;
      this.currentVelocity = v0 - this.gravity * this.simTime;
      this.isRunning = false;
      this.hasLanded = true;
    }

    this.drawScene();

    if (this.isRunning) {
      this.animFrameId = requestAnimationFrame((ts) => this.animate(ts));
    }
  }

  private drawScene(): void {
    const canvas = this.canvasRef?.nativeElement;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    const W = canvas.width;
    const H = canvas.height;

    ctx.fillStyle = '#0a1628';
    ctx.fillRect(0, 0, W, H);

    const groundY = H - 50;
    const topY = 40;
    const v0 = this.simMode === 'caida' ? 0 : this.initialVelocity;
    const maxHeightCalc = this.initialHeight + (v0 * v0) / (2 * this.gravity);
    const displayMaxHeight = Math.max(20, Math.ceil(maxHeightCalc / 10) * 10);
    const scaleY = (groundY - topY) / displayMaxHeight;

    // Sky gradient
    const skyGrad = ctx.createLinearGradient(0, 0, 0, groundY);
    skyGrad.addColorStop(0, '#0d1b2a');
    skyGrad.addColorStop(1, '#1a2a44');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, W, groundY);

    // Ground
    ctx.fillStyle = '#263238';
    ctx.fillRect(0, groundY, W, H - groundY);
    ctx.strokeStyle = '#4fc3f730';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, groundY);
    ctx.lineTo(W, groundY);
    ctx.stroke();

    // Height ruler
    const rulerX = W / 2 - 120;
    ctx.strokeStyle = '#4fc3f725';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(rulerX, topY);
    ctx.lineTo(rulerX, groundY);
    ctx.stroke();
    ctx.setLineDash([]);

    // Height markers
    ctx.fillStyle = '#4fc3f750';
    ctx.font = '11px Inter, sans-serif';
    ctx.textAlign = 'right';
    const step = displayMaxHeight > 50 ? 20 : 10;
    for (let m = 0; m <= displayMaxHeight; m += step) {
      const py = groundY - m * scaleY;
      ctx.fillRect(rulerX - 6, py, 12, 1);
      ctx.fillText(m + 'm', rulerX - 12, py + 4);
    }

    // Trail dots
    const objX = W / 2;
    ctx.fillStyle = '#4fc3f730';
    for (const pt of this.trail) {
      const py = groundY - pt.y * scaleY;
      ctx.beginPath();
      ctx.arc(objX, py, 4, 0, Math.PI * 2);
      ctx.fill();
    }

    // Object
    const objY = groundY - this.currentHeight * scaleY;
    const objRadius = 16;

    // Glow
    const glow = ctx.createRadialGradient(objX, objY, 0, objX, objY, objRadius * 3);
    glow.addColorStop(0, 'rgba(79, 195, 247, 0.2)');
    glow.addColorStop(1, 'transparent');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(objX, objY, objRadius * 3, 0, Math.PI * 2);
    ctx.fill();

    // Ball
    const ballGrad = ctx.createRadialGradient(objX - 4, objY - 4, 2, objX, objY, objRadius);
    ballGrad.addColorStop(0, '#81d4fa');
    ballGrad.addColorStop(0.5, '#29b6f6');
    ballGrad.addColorStop(1, '#0277bd');
    ctx.fillStyle = ballGrad;
    ctx.beginPath();
    ctx.arc(objX, objY, objRadius, 0, Math.PI * 2);
    ctx.fill();

    // Velocity arrow
    if (Math.abs(this.currentVelocity) > 0.5 && this.currentHeight > 0) {
      const arrowLen = Math.min(Math.abs(this.currentVelocity) * 2.5, 80);
      const isUp = this.currentVelocity > 0;
      ctx.strokeStyle = isUp ? '#4caf50' : '#ff7043';
      ctx.lineWidth = 3;
      ctx.beginPath();
      
      const startY = isUp ? (objY - objRadius - 4) : (objY + objRadius + 4);
      const endY = isUp ? (startY - arrowLen) : (startY + arrowLen);
      
      ctx.moveTo(objX, startY);
      ctx.lineTo(objX, endY);
      ctx.stroke();
      
      ctx.fillStyle = isUp ? '#4caf50' : '#ff7043';
      ctx.beginPath();
      if (isUp) {
        ctx.moveTo(objX, endY - 6);
        ctx.lineTo(objX - 6, endY);
        ctx.lineTo(objX + 6, endY);
      } else {
        ctx.moveTo(objX, endY + 6);
        ctx.lineTo(objX - 6, endY);
        ctx.lineTo(objX + 6, endY);
      }
      ctx.closePath();
      ctx.fill();
      ctx.font = 'bold 12px Inter, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(isUp ? 'v↑' : 'v↓', objX + 10, startY + (isUp ? -arrowLen / 2 : arrowLen / 2));
    }

    // Gravity label
    ctx.fillStyle = '#4fc3f780';
    ctx.font = 'bold 12px Inter, sans-serif';
    ctx.textAlign = 'left';
    const gOpt = this.gravityOptions.find(o => o.key === this.gravityPreset);
    ctx.fillText(`g = ${this.gravity} m/s² (${gOpt?.label})`, 16, 28);

    // Landing message
    if (this.hasLanded) {
      ctx.fillStyle = '#4caf50';
      ctx.font = 'bold 16px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('¡IMPACTO!', objX, groundY + 28);
      ctx.font = '13px Inter, sans-serif';
      ctx.fillStyle = '#a5d6a7';
      const impVel = Math.abs(this.currentVelocity);
      ctx.fillText(`t = ${this.simTime.toFixed(2)}s · v = ${impVel.toFixed(1)} m/s`, objX, groundY + 44);
    }

    // Info panel (right side)
    ctx.fillStyle = '#e0f7fa';
    ctx.font = 'bold 13px Inter, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(`t = ${this.simTime.toFixed(2)} s`, W - 16, 28);
    ctx.fillText(`h = ${this.currentHeight.toFixed(1)} m`, W - 16, 48);
    ctx.fillText(`v = ${Math.abs(this.currentVelocity).toFixed(1)} m/s`, W - 16, 68);
  }
}
