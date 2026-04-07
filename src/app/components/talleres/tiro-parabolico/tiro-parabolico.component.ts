import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

interface ConceptCard {
  icon: string;
  title: string;
  description: string;
}

interface FormulaItem {
  label: string;
  formula: string;
  meaning: string;
}

interface ActivityStep {
  step: number;
  instruction: string;
  question: string;
}

@Component({
  selector: 'app-tiro-parabolico',
  templateUrl: './tiro-parabolico.component.html',
  styleUrls: ['./tiro-parabolico.component.css']
})
export class TiroParabolicoComponent implements OnInit {
  simulatorUrl: SafeResourceUrl;
  activeSection: string = 'teoria';
  expandedFormula: number = -1;

  concepts: ConceptCard[] = [
    {
      icon: '📐',
      title: 'Dos movimientos en uno',
      description: 'El tiro parabólico combina un movimiento horizontal uniforme (MRU) con un movimiento vertical acelerado (caída libre). Ambos ocurren simultáneamente e independientemente.'
    },
    {
      icon: '🎯',
      title: 'Ángulo de lanzamiento',
      description: 'El ángulo con el que se lanza un proyectil determina su trayectoria. A 45° se obtiene el mayor alcance horizontal en condiciones ideales (sin resistencia del aire).'
    },
    {
      icon: '⚡',
      title: 'Velocidad inicial',
      description: 'Se descompone en dos componentes: horizontal (Vₓ = V₀·cos θ) que permanece constante, y vertical (Vᵧ = V₀·sen θ) que cambia por la gravedad.'
    },
    {
      icon: '🌍',
      title: 'Gravedad constante',
      description: 'La aceleración de la gravedad (g ≈ 9.8 m/s²) actúa solo en dirección vertical, frenando el ascenso y acelerando el descenso del proyectil.'
    }
  ];

  formulas: FormulaItem[] = [
    {
      label: 'Posición horizontal',
      formula: 'x = V₀ · cos(θ) · t',
      meaning: 'La distancia horizontal recorrida depende de la componente horizontal de la velocidad y del tiempo transcurrido.'
    },
    {
      label: 'Posición vertical',
      formula: 'y = V₀ · sen(θ) · t − ½ · g · t²',
      meaning: 'La altura del proyectil depende de la componente vertical inicial menos el efecto de la gravedad que lo jala hacia abajo.'
    },
    {
      label: 'Alcance máximo',
      formula: 'R = (V₀² · sen(2θ)) / g',
      meaning: 'La distancia horizontal total que recorre el proyectil antes de regresar a la misma altura desde donde fue lanzado.'
    },
    {
      label: 'Altura máxima',
      formula: 'H = (V₀ · sen(θ))² / (2 · g)',
      meaning: 'El punto más alto que alcanza el proyectil durante su trayectoria, donde la velocidad vertical es cero.'
    },
    {
      label: 'Tiempo de vuelo',
      formula: 'T = (2 · V₀ · sen(θ)) / g',
      meaning: 'El tiempo total que el proyectil permanece en el aire, desde el lanzamiento hasta que vuelve a la misma altura.'
    }
  ];

  activities: ActivityStep[] = [
    {
      step: 1,
      instruction: 'Abre el simulador y selecciona el modo "Intro". Configura el ángulo a 45° y la velocidad inicial a 15 m/s. Lanza el proyectil y observa la trayectoria.',
      question: '¿Qué forma tiene la trayectoria del proyectil? ¿Por qué crees que tiene esa forma?'
    },
    {
      step: 2,
      instruction: 'Sin cambiar la velocidad (15 m/s), realiza 3 lanzamientos con ángulos diferentes: 30°, 45° y 60°. Anota el alcance horizontal de cada uno.',
      question: '¿Con cuál ángulo se obtuvo mayor alcance? ¿Qué relación notas entre los ángulos de 30° y 60°?'
    },
    {
      step: 3,
      instruction: 'Fija el ángulo en 45° y varía la velocidad inicial: prueba con 10 m/s, 15 m/s y 20 m/s. Observa cómo cambia la trayectoria.',
      question: '¿Cómo afecta la velocidad inicial al alcance y la altura máxima del proyectil?'
    },
    {
      step: 4,
      instruction: 'Activa la opción de "Resistencia del aire" en el simulador. Repite el lanzamiento con ángulo 45° y velocidad 15 m/s.',
      question: '¿Qué cambios observas en la trayectoria cuando hay resistencia del aire? ¿El alcance es mayor o menor?'
    },
    {
      step: 5,
      instruction: 'En el modo "Laboratorio", selecciona diferentes objetos (pelota de béisbol, balón de fútbol, auto, piano) y lánzalos con los mismos parámetros.',
      question: 'Sin resistencia del aire, ¿influye la masa del objeto en la trayectoria? ¿Y con resistencia del aire activada?'
    }
  ];

  constructor(
    private router: Router,
    private sanitizer: DomSanitizer
  ) {
    this.simulatorUrl = this.sanitizer.bypassSecurityTrustResourceUrl(
      'https://phet.colorado.edu/sims/html/projectile-motion/latest/projectile-motion_es.html'
    );
  }

  ngOnInit(): void {}

  goBack(): void {
    this.router.navigate(['/dashboard']);
  }

  setSection(section: string): void {
    this.activeSection = section;
  }

  toggleFormula(index: number): void {
    this.expandedFormula = this.expandedFormula === index ? -1 : index;
  }
}
