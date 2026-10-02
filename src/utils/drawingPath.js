// Traços são guardados como strings SVG dentro do documento da sala (limite de 1 MiB).
// Arredondar as coordenadas e limitar o tamanho evita que o envio falhe no fim da partida.

const roundCoord = (value) => Math.round(value * 10) / 10;

export const buildSvgPath = (points = []) => {
    const parts = [];
    let previous = null;

    points.forEach((point) => {
        const x = roundCoord(point.x);
        const y = roundCoord(point.y);
        if (previous && previous.x === x && previous.y === y) return;
        parts.push(parts.length === 0 ? `M ${x} ${y}` : `L ${x} ${y}`);
        previous = { x, y };
    });

    return parts.join(' ');
};

// Mantém o primeiro e o último ponto e descarta um ponto sim, um não, no meio.
export const thinSvgPath = (path = '') => {
    const segments = path.split(' L ');
    if (segments.length <= 3) return path;

    const kept = segments.filter((_, index) => (
        index === 0 || index === segments.length - 1 || index % 2 === 0
    ));
    return kept.join(' L ');
};

export const estimateStrokesSize = (strokes = []) => JSON.stringify(strokes).length;

// Afina os traços até caberem no orçamento (em caracteres). Sempre devolve algo enviável.
export const fitStrokesToBudget = (strokes = [], maxChars = 60000) => {
    let current = strokes;
    for (let attempt = 0; attempt < 8 && estimateStrokesSize(current) > maxChars; attempt += 1) {
        current = current.map((stroke) => ({ ...stroke, path: thinSvgPath(stroke.path) }));
    }
    return current;
};

// Orçamento por desenho no Telefone: todas as threads dividem o mesmo documento.
export const getTelephoneDrawingBudget = ({ playerCount = 2, totalTurns = 3 }) => {
    const drawingsPerThread = Math.max(1, Math.floor(totalTurns / 2));
    const drawingCount = Math.max(1, playerCount) * drawingsPerThread;
    return Math.max(8000, Math.floor(650000 / drawingCount));
};
