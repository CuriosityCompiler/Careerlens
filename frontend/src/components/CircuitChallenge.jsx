import { useRef, useState } from "react";
import { CircuitBoard, Code2, Loader2, Play, Plus, Trash2, Unplug } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

const UNO_PINS = [
  "5V", "3V3", "GND", "VIN",
  ...Array.from({ length: 12 }, (_, index) => `D${index + 2}`),
  ...Array.from({ length: 6 }, (_, index) => `A${index}`),
  "SDA", "SCL",
];

const PARTS = [
  { kind: "thermistor", label: "NTC thermistor", pins: ["power", "signal"] },
  { kind: "resistor", label: "Resistor", pins: ["leg1", "leg2"] },
  { kind: "led", label: "LED", pins: ["anode", "cathode"] },
  { kind: "transistor", label: "NPN transistor", pins: ["base", "collector", "emitter"] },
  { kind: "dc_motor", label: "DC motor", pins: ["terminal1", "terminal2"] },
  { kind: "ultrasonic_sensor", label: "Ultrasonic sensor", pins: ["vcc", "trigger", "echo", "ground"] },
  { kind: "motor_driver", label: "H-bridge driver", pins: ["logicVcc", "motorVcc", "input1", "input2", "enable", "output1", "output2", "ground"] },
  { kind: "pushbutton", label: "Push button", pins: ["signal", "ground"] },
  { kind: "lcd_display", label: "I2C display", pins: ["vcc", "ground", "sda", "scl"] },
  { kind: "buzzer", label: "Buzzer", pins: ["positive", "negative"] },
  { kind: "servo", label: "Servo motor", pins: ["signal", "power", "ground"] },
  { kind: "photoresistor", label: "Photoresistor", pins: ["leg1", "leg2"] },
  { kind: "diode", label: "Diode", pins: ["anode", "cathode"] },
  { kind: "battery", label: "External supply", pins: ["positive", "negative"] },
];

function endpointLabel(endpoint, components) {
  const [id, pin] = endpoint.split(".");
  const component = id === "uno" ? { label: "Arduino Uno" } : components.find((item) => item.id === id);
  return `${component?.label || id} · ${pin}`;
}

export default function CircuitChallenge({ value, onChange, code, onCodeChange, consoleOutput, runningCode = false, onRun, disabled = false }) {
  const [activeTerminal, setActiveTerminal] = useState(null);
  const [activeView, setActiveView] = useState("circuit");
  const nextIds = useRef({});
  const components = value.components || [];
  const connections = value.connections || [];

  const addPart = (part) => {
    nextIds.current[part.kind] = (nextIds.current[part.kind] || 0) + 1;
    const instance = nextIds.current[part.kind];
    onChange({
      ...value,
      components: [...components, {
        id: `${part.kind}_${instance}`,
        kind: part.kind,
        label: instance === 1 ? part.label : `${part.label} ${instance}`,
      }],
    });
  };

  const toggleWire = (endpoint) => {
    if (!activeTerminal) {
      setActiveTerminal(endpoint);
      return;
    }
    if (activeTerminal === endpoint) {
      setActiveTerminal(null);
      return;
    }
    const duplicate = connections.some(({ from, to }) =>
      (from === activeTerminal && to === endpoint) || (from === endpoint && to === activeTerminal)
    );
    if (!duplicate) {
      onChange({ ...value, connections: [...connections, { from: activeTerminal, to: endpoint }] });
    }
    setActiveTerminal(null);
  };

  const removePart = (id) => {
    onChange({
      ...value,
      components: components.filter((component) => component.id !== id),
      connections: connections.filter(({ from, to }) => !from.startsWith(`${id}.`) && !to.startsWith(`${id}.`)),
    });
    setActiveTerminal(null);
  };

  const removeConnection = (index) => {
    onChange({ ...value, connections: connections.filter((_, itemIndex) => itemIndex !== index) });
  };

  const terminal = (componentId, componentLabel, pin) => {
    const endpoint = `${componentId}.${pin}`;
    const selected = activeTerminal === endpoint;
    return (
      <button
        key={endpoint}
        type="button"
        aria-pressed={selected}
        title={`${componentLabel} ${pin}`}
        aria-label={`${componentLabel} ${pin}`}
        onClick={() => toggleWire(endpoint)}
        disabled={disabled}
        className={`rounded border px-2 py-1 font-mono text-[10px] transition-colors ${
          selected
            ? "border-amber-500 bg-amber-100 text-amber-900"
            : "border-slate-300 bg-white text-slate-600 hover:border-teal-500 hover:text-teal-800 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-300"
        }`}
      >
        {pin}
      </button>
    );
  };

  return (
    <div className="space-y-4" data-testid="circuit-workbench">
      <section className="border-b border-slate-200 pb-4 dark:border-slate-700">
        <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-800 dark:text-slate-100">
          <CircuitBoard className="h-4 w-4 text-teal-700 dark:text-teal-400" /> Parts library
        </div>
        <div className="flex flex-wrap gap-2">
          {PARTS.map((part) => (
            <Button
              key={part.kind}
              type="button"
              size="sm"
              variant="outline"
              onClick={() => addPart(part)}
              disabled={disabled}
              className="h-8 border-slate-300 bg-white px-2.5 text-xs text-slate-700 hover:border-teal-500 hover:text-teal-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              aria-label={`Add ${part.label}`}
            >
              <Plus className="mr-1 h-3.5 w-3.5" /> {part.label}
            </Button>
          ))}
        </div>
      </section>

      <section
        className="min-h-64 rounded-lg border border-slate-300 p-3 dark:border-slate-700"
        style={{ backgroundImage: "radial-gradient(#94a3b8 0.7px, transparent 0.7px)", backgroundSize: "16px 16px" }}
        data-testid="circuit-canvas"
      >
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="text-sm font-semibold text-slate-800 dark:text-slate-100">Workbench</div>
          <button
            type="button"
            onClick={() => setActiveView("sketch")}
            className="inline-flex items-center gap-1.5 rounded border border-teal-700 px-2.5 py-1.5 text-xs font-semibold text-teal-800 hover:bg-teal-50 dark:text-teal-300 dark:hover:bg-teal-950/40"
            aria-label="Write Arduino sketch"
          >
            <Code2 className="h-3.5 w-3.5" /> Write Sketch
          </button>
        </div>
        <div className="mb-3 flex gap-2" role="tablist" aria-label="Arduino Uno workspace">
          {[
            { id: "circuit", label: "Circuit" },
            { id: "sketch", label: "Arduino Sketch" },
          ].map((view) => (
            <button
              key={view.id}
              type="button"
              role="tab"
              aria-selected={activeView === view.id}
              onClick={() => setActiveView(view.id)}
              className={`rounded border px-3 py-1.5 text-xs font-semibold ${
                activeView === view.id
                  ? "border-teal-800 bg-teal-800 text-white"
                  : "border-slate-300 bg-white text-slate-600 hover:border-teal-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
              }`}
            >
              {view.label}
            </button>
          ))}
          <span className="ml-auto self-center text-[11px] text-slate-500 dark:text-slate-400">
            {code?.trim() ? "Sketch entered" : "Uno not programmed"}
          </span>
        </div>
        {activeView === "circuit" ? (
          <>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <article className="rounded-md border border-teal-700 bg-teal-950 p-3 text-white shadow-sm">
            <div className="mb-2 text-sm font-bold">Arduino Uno</div>
            <div className="flex flex-wrap gap-1.5">
              {UNO_PINS.map((pin) => terminal("uno", "Arduino Uno", pin))}
            </div>
          </article>
          {components.map((component) => {
            const part = PARTS.find((item) => item.kind === component.kind);
            return (
              <article key={component.id} className="rounded-md border border-slate-300 bg-white/95 p-3 shadow-sm dark:border-slate-700 dark:bg-slate-900/95">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <div className="text-sm font-semibold text-slate-800 dark:text-slate-100">{component.label}</div>
                  <button
                    type="button"
                    onClick={() => removePart(component.id)}
                    disabled={disabled}
                    title={`Remove ${component.label}`}
                    aria-label={`Remove ${component.label}`}
                    className="rounded p-1 text-slate-500 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950/40"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {part?.pins.map((pin) => terminal(component.id, component.label, pin))}
                </div>
              </article>
            );
          })}
        </div>
        {activeTerminal && (
          <div className="mt-3 inline-flex items-center gap-2 rounded border border-amber-300 bg-amber-50 px-2.5 py-1.5 text-xs text-amber-900">
            <span className="font-mono">{endpointLabel(activeTerminal, components)}</span>
            <button type="button" onClick={() => setActiveTerminal(null)} disabled={disabled} aria-label="Cancel wire" className="rounded p-0.5 hover:bg-amber-100">
              <Unplug className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
          </>
        ) : (
          <div className="space-y-2" data-testid="arduino-sketch-panel">
            <div className="flex items-center justify-between gap-3 text-xs font-semibold text-slate-600 dark:text-slate-300">
              <label htmlFor="arduino-sketch">Arduino Uno firmware</label>
              <span className="font-normal">C++</span>
            </div>
            <Textarea
              id="arduino-sketch"
              data-testid="iv-answer"
              rows={22}
              value={code || ""}
              onChange={(event) => onCodeChange(event.target.value)}
              disabled={disabled}
              className="resize-y border-slate-700 bg-slate-950 font-mono text-sm leading-relaxed text-green-300"
              spellCheck={false}
              autoCapitalize="off"
              autoCorrect="off"
              aria-label="Arduino Uno firmware editor"
            />
            <section className="rounded-lg border border-slate-700 bg-slate-950 p-3" aria-label="Arduino preview output">
              <div className="mb-2 flex items-center justify-between gap-3">
                <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">Output preview</div>
                <Button
                  type="button"
                  size="sm"
                  onClick={onRun}
                  disabled={disabled || runningCode || !code?.trim()}
                  className="h-7 bg-emerald-700 px-2.5 text-xs text-white hover:bg-emerald-600"
                  data-testid="btn-run-arduino"
                >
                  {runningCode ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Play className="mr-1.5 h-3.5 w-3.5" />}
                  {runningCode ? "Running" : "Run sketch"}
                </Button>
              </div>
              <pre
                className="min-h-24 max-h-64 overflow-auto whitespace-pre-wrap break-words rounded border border-slate-800 bg-black p-3 font-mono text-xs leading-relaxed text-green-300"
                data-testid="arduino-output"
              >
                {consoleOutput || "Run the sketch to inspect Serial output and simulated pin activity."}
              </pre>
              <p className="mt-2 text-[10px] text-slate-500">
                Preview uses simulated inputs and three loop cycles; it is not a physical hardware simulation.
              </p>
            </section>
          </div>
        )}
      </section>

      {activeView === "circuit" && <section className="space-y-2" aria-label="Circuit connections">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-slate-300">
          <span>Connections</span>
          <span>{connections.length}</span>
        </div>
        {connections.length === 0 ? (
          <div className="rounded border border-dashed border-slate-300 px-3 py-2 text-xs text-slate-500 dark:border-slate-700 dark:text-slate-400">No connections</div>
        ) : (
          <ul className="space-y-1.5">
            {connections.map(({ from, to }, index) => (
              <li key={`${from}-${to}-${index}`} className="flex items-center justify-between gap-2 rounded border border-slate-200 bg-white px-2.5 py-1.5 text-xs dark:border-slate-700 dark:bg-slate-900">
                <span className="min-w-0 truncate font-mono text-slate-700 dark:text-slate-300">{endpointLabel(from, components)} <span className="text-teal-700">--</span> {endpointLabel(to, components)}</span>
                <button type="button" onClick={() => removeConnection(index)} disabled={disabled} aria-label="Remove connection" title="Remove connection" className="rounded p-1 text-slate-500 hover:text-red-700">
                  <Unplug className="h-3.5 w-3.5" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>}
    </div>
  );
}