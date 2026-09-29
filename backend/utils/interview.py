"""Adaptive mock interview engine with DSA & live coding challenges for Hard difficulty."""
import re
from data.roles import ROLES_BY_ID

QUESTION_BANK = {
    "frontend": {
        "beginner": [
            {"q": "What is the difference between var, let, and const in JavaScript?", "topic": "javascript", "type": "technical"},
            {"q": "Explain the CSS box model and how box-sizing affects it.", "topic": "css", "type": "technical"},
            {"q": "What is the virtual DOM and why does React use it?", "topic": "react", "type": "technical"},
            {"q": "How would you make a website responsive across mobile and desktop?", "topic": "css", "type": "technical"},
        ],
        "intermediate": [
            {"q": "Walk me through how React reconciliation and the diffing algorithm work.", "topic": "react", "type": "technical"},
            {"q": "How do you optimize Web Vitals (LCP, CLS, INP) on a content-heavy page?", "topic": "performance", "type": "technical"},
            {"q": "Describe a time you shipped a complex feature under a tight deadline using the STAR framework.", "topic": "behavioral", "type": "behavioral"},
        ],
        "advanced": [
            {"q": "How would you architect a design system used across 5 distinct product teams?", "topic": "system design", "type": "technical"},
            {"q": "Explain Server Components in Next.js and identify scenarios when NOT to use them.", "topic": "nextjs", "type": "technical"},
            {"q": "Tell me about the most complex web accessibility (WCAG 2.1 AA) issue you fixed.", "topic": "accessibility", "type": "behavioral"},
        ],
        "hard": [{"q": "DSA Coding: Implement an LRU (Least Recently Used) Cache in JavaScript or TypeScript with get(key) and put(key, value) operations running in O(1) average time complexity using a Hash Map and Doubly Linked List. Provide the full code.", "topic": "dsa", "type": "coding", "starter_code": "// Implement LRU Cache\nclass LRUCache {\n  constructor(capacity) {\n    this.capacity = capacity;\n  }\n  get(key) {\n    // O(1) lookup\n  }\n  put(key, value) {\n    // O(1) insert/update with eviction\n  }\n}"}, {"q": "DSA Coding: Implement a custom Promise.allSettled polyfill in JavaScript from scratch that takes an array of Promises and returns a single Promise resolving to an array of outcome objects ({status: 'fulfilled', value} or {status: 'rejected', reason}).", "topic": "javascript", "type": "coding", "starter_code": "function allSettled(promises) {\n  return new Promise((resolve) => {\n    // Write implementation here\n  });\n}"}, {"q": "DSA Coding: Given an array of nested DOM element objects or directory tree nodes, write a function to perform Breadth-First Search (BFS) and Depth-First Search (DFS) traversal to find all nodes with a given property.", "topic": "dsa", "type": "coding", "starter_code": "function findNodes(root, predicate) {\n  // Implement BFS or DFS\n}"}],
    },
    "backend": {
        "beginner": [
            {"q": "What is the difference between SQL and NoSQL databases, and when do you choose each?", "topic": "sql", "type": "technical"},
            {"q": "Explain what a REST API is and what makes it truly stateless.", "topic": "rest", "type": "technical"},
            {"q": "What is the difference between processes and threads in an operating system?", "topic": "os", "type": "technical"},
        ],
        "intermediate": [
            {"q": "How would you design cursor-based pagination for a table with 10M rows in PostgreSQL?", "topic": "sql", "type": "technical"},
            {"q": "Explain database indexing tradeoffs (B-Tree vs Hash index, write overhead).", "topic": "sql", "type": "technical"},
            {"q": "Describe how you handled a production outage or critical bug in a backend service.", "topic": "behavioral", "type": "behavioral"},
        ],
        "advanced": [
            {"q": "Design a high-throughput rate limiter for a public API using Redis token buckets.", "topic": "system design", "type": "technical"},
            {"q": "How would you build a reliable event streaming pipeline with Kafka for order events?", "topic": "kafka", "type": "technical"},
        ],
        "hard": [{"q": "DSA Coding: Implement a Thread-Safe In-Memory Cache with TTL (Time-To-Live) and an O(1) eviction policy in Python or Go. Handle race conditions during concurrent reads and writes.", "topic": "dsa", "type": "coding", "starter_code": "import time\nimport threading\n\nclass TTLCache:\n    def __init__(self, capacity: int, default_ttl: float):\n        self.capacity = capacity\n        self.default_ttl = default_ttl\n        self.lock = threading.Lock()\n        self.store = {}\n\n    def get(self, key):\n        pass\n\n    def set(self, key, value, ttl=None):\n        pass"}, {"q": "DSA Coding: Given a list of service dependencies (task A must run before task B), implement a Topological Sort algorithm to determine a valid startup sequence or detect circular dependency deadlocks.", "topic": "dsa", "type": "coding", "starter_code": "from typing import List, Tuple\n\ndef find_build_order(num_services: int, dependencies: List[Tuple[int, int]]) -> List[int]:\n    # Implement Kahn's Algorithm (indegree) or DFS\n    pass"}, {"q": "DSA Coding: Implement a Token Bucket Rate Limiter algorithm in Python. Given capacity and refill_rate_per_sec, write allow_request(tokens=1) returning True if allowed, False if throttled.", "topic": "system design", "type": "coding", "starter_code": "import time\n\nclass TokenBucket:\n    def __init__(self, capacity: int, refill_rate: float):\n        self.capacity = capacity\n        self.refill_rate = refill_rate\n        self.tokens = capacity\n        self.last_refill = time.time()\n\n    def allow_request(self, tokens: int = 1) -> bool:\n        pass"}],
    },
    "fullstack": {
        "beginner": [
            {"q": "How does data flow from a React form submission to a database write?", "topic": "fullstack", "type": "technical"},
            {"q": "What is CORS and why is preflight (OPTIONS request) necessary?", "topic": "web", "type": "technical"},
        ],
        "intermediate": [
            {"q": "How would you structure a monorepo with shared TypeScript types between frontend and backend?", "topic": "fullstack", "type": "technical"},
            {"q": "Describe a challenging bug that spanned across both client and server layers.", "topic": "behavioral", "type": "behavioral"},
        ],
        "advanced": [
            {"q": "Design an end-to-end telemetry system: client instrumentation, ingestion, stream processing, and dashboards.", "topic": "system design", "type": "technical"},
        ],
        "hard": [{"q": "DSA Coding: Implement a Trie (Prefix Tree) data structure for an instant search autocomplete feature. Include insert(word) and search_prefix(prefix) returning the top 5 matching words.", "topic": "dsa", "type": "coding", "starter_code": "class TrieNode:\n    def __init__(self):\n        self.children = {}\n        self.is_end = False\n\nclass AutocompleteTrie:\n    def __init__(self):\n        self.root = TrieNode()\n    def insert(self, word: str):\n        pass\n    def search_prefix(self, prefix: str):\n        pass"}],
    },
    "data_analyst": {
        "beginner": [
            {"q": "How would you find duplicate rows in a table using SQL window functions?", "topic": "sql", "type": "technical"},
            {"q": "What is the difference between mean, median, and mode, and which resists outliers?", "topic": "statistics", "type": "statistics"},
        ],
        "intermediate": [
            {"q": "Walk me through analyzing an A/B test that shows a 2% conversion lift with p=0.08.", "topic": "statistics", "type": "statistics"},
            {"q": "How would you design a KPI dashboard for a subscription SaaS business?", "topic": "analytics", "type": "technical"},
        ],
        "advanced": [
            {"q": "How do you decide when to build a modeled data mart in dbt vs. executing ad-hoc queries?", "topic": "data modeling", "type": "technical"},
        ],
        "hard": [{"q": "DSA Coding: Implement an algorithm to find the rolling median of a real-time stream of numbers using Two Heaps (Max-Heap for lower half, Min-Heap for upper half) with O(log N) insertion.", "topic": "dsa", "type": "coding", "starter_code": "import heapq\n\nclass MedianFinder:\n    def __init__(self):\n        self.small = [] # max heap (invert values)\n        self.large = [] # min heap\n    def add_num(self, num: int) -> None:\n        pass\n    def find_median(self) -> float:\n        pass"}],
    },
    "python_developer": {
        "beginner": [
            {"q": "Explain Python list vs. tuple and their internal memory models.", "topic": "python", "type": "technical"},
            {"q": "How do Python generators work and what are their memory benefits?", "topic": "python", "type": "technical"},
        ],
        "intermediate": [
            {"q": "How does the GIL affect concurrency in Python, and how do asyncio vs. multiprocessing differ?", "topic": "python", "type": "technical"},
        ],
        "advanced": [
            {"q": "Design an async task queue in Python for high-concurrency background jobs.", "topic": "system design", "type": "technical"},
        ],
        "hard": [{"q": "DSA Coding: Implement a Min-Heap from scratch in Python (without using heapq) supporting insert, extract_min, and peek in O(log N) time.", "topic": "dsa", "type": "coding", "starter_code": "class MinHeap:\n    def __init__(self):\n        self.heap = []\n    def push(self, val):\n        pass\n    def pop(self):\n        pass\n    def peek(self):\n        pass"}],
    },
    "java_developer": {
        "beginner": [
            {"q": "Explain JVM, JRE, and JDK, and what bytecode execution entails.", "topic": "java", "type": "technical"},
        ],
        "intermediate": [
            {"q": "How does Spring dependency injection work under the hood with BeanFactory?", "topic": "spring", "type": "technical"},
        ],
        "advanced": [
            {"q": "Design a distributed cache layer with Redis and Spring Boot for high-read APIs.", "topic": "system design", "type": "technical"},
        ],
        "hard": [{"q": "DSA Coding: Implement a custom Bounded Blocking Queue in Java using synchronization primitives (wait/notify or ReentrantLock and Condition).", "topic": "dsa", "type": "coding", "starter_code": "public class BoundedBlockingQueue<T> {\n    private int capacity;\n    public BoundedBlockingQueue(int capacity) {\n        this.capacity = capacity;\n    }\n    public void enqueue(T item) throws InterruptedException {\n        // block if full\n    }\n    public T dequeue() throws InterruptedException {\n        // block if empty\n    }\n}"}],
    },
    "aiml": {
        "beginner": [
            {"q": "Explain the bias-variance tradeoff and how regularization helps prevent overfitting.", "topic": "ml", "type": "technical"},
        ],
        "intermediate": [
            {"q": "How would you evaluate and optimize a machine learning model on a heavily imbalanced dataset?", "topic": "ml", "type": "technical"},
        ],
        "advanced": [
            {"q": "Walk me through the pipeline for fine-tuning an LLM on domain-specific proprietary docs using LoRA.", "topic": "llm", "type": "technical"},
        ],
        "hard": [{"q": "DSA Coding: Implement the forward pass of a Scaled Dot-Product Attention mechanism in NumPy or PyTorch from scratch (Attention(Q, K, V) = softmax(QK^T / sqrt(d_k)) * V).", "topic": "ml", "type": "coding", "starter_code": "import numpy as np\n\ndef scaled_dot_product_attention(Q, K, V, mask=None):\n    # d_k = Q.shape[-1]\n    # Calculate attention weights and output\n    pass"}],
    },
    "embedded_systems_engineer": {
        "beginner": [
            {"q": "Explain the difference between a microcontroller and a microprocessor, and where each is used.", "topic": "microcontroller", "type": "technical"},
            {"q": "How do GPIO, ADC, and PWM work in an embedded system? Give a real-world example using an ESP32 sensor node.", "topic": "esp32", "type": "technical"},
            {"q": "What is the role of UART, SPI, and I2C in connecting sensors and peripherals?", "topic": "uart", "type": "technical"},
        ],
        "intermediate": [
            {"q": "How would you design a firmware routine to read temperature from an I2C sensor and log values every second on an ESP32?", "topic": "esp32", "type": "technical"},
            {"q": "Explain interrupt handling, timers, and debouncing in embedded firmware design.", "topic": "interrupts", "type": "technical"},
            {"q": "Describe a debugging flow for an embedded board where ADC readings fluctuate unexpectedly.", "topic": "debugging", "type": "behavioral"},
        ],
        "advanced": [
            {"q": "Design a low-power embedded architecture for a battery-operated wireless sensor node using ESP32, sensors, and MQTT.", "topic": "iot", "type": "technical"},
            {"q": "When would you choose FreeRTOS over a super-loop design, and how do you manage task priorities and synchronization?", "topic": "rtos", "type": "technical"},
        ],
        "hard": [{"q": "DSA Coding: Implement a sensor data buffer with fixed-size circular queue logic in C or C++ for a microcontroller. Include enqueue, dequeue, and isempty operations.", "topic": "embedded c", "type": "coding", "starter_code": "#include <stdint.h>\n\ntypedef struct {\n    int size;\n    int head;\n    int tail;\n    int *data;\n} CircularBuffer;\n\nint enqueue(CircularBuffer *buf, int value) {\n    return 0;\n}\n\nint dequeue(CircularBuffer *buf, int *out) {\n    return 0;\n}"}],
    },
    "electronics_engineer": {
        "beginner": [
            {"q": "What is the difference between active and passive electronic components? Give one example of each.", "topic": "electronic components", "type": "technical"},
            {"q": "How does a diode behave when it is forward-biased versus reverse-biased?", "topic": "diodes", "type": "technical"},
            {"q": "What is the purpose of a resistor-capacitor (RC) circuit, and how does changing the capacitor affect its response time?", "topic": "analog circuits", "type": "technical"},
        ],
        "intermediate": [
            {"q": "How would you use an operational amplifier as a non-inverting amplifier, and what determines its voltage gain?", "topic": "op-amps", "type": "technical"},
            {"q": "Explain how an ADC converts an analog sensor voltage into a digital value, including the effect of resolution.", "topic": "adc", "type": "technical"},
            {"q": "How would you troubleshoot excessive noise in an analog sensor signal before it reaches a microcontroller?", "topic": "signal conditioning", "type": "technical"},
        ],
        "advanced": [
            {"q": "How would you design and validate a low-noise amplifier stage for a small sensor signal, considering bandwidth, gain, and component tolerances?", "topic": "analog design", "type": "technical"},
            {"q": "Describe the steps you would take to diagnose a PCB that intermittently resets when a load switches on.", "topic": "pcb debugging", "type": "technical"},
        ],
        "hard": [
            {"q": "Design a signal-conditioning circuit for a noisy 0-100 mV sensor output that must be sampled by a 3.3 V microcontroller ADC. Explain your gain, filtering, protection, and calibration choices.", "topic": "analog circuit design", "type": "technical"},
        ],
    },
    "electrical_engineer": {
        "beginner": [
            {"q": "Explain the working principle of a transformer and the difference between step-up and step-down operation.", "topic": "transformer", "type": "technical"},
            {"q": "How do AC and DC circuits differ in terms of analysis, power factor, and components?", "topic": "circuits", "type": "technical"},
        ],
        "intermediate": [
            {"q": "Explain the operating principle of induction motors and how slip affects torque and efficiency.", "topic": "electrical machines", "type": "technical"},
            {"q": "How would you analyze a three-phase power system for efficiency and fault behavior?", "topic": "power systems", "type": "technical"},
        ],
        "advanced": [
            {"q": "Design a closed-loop control system for a DC motor and explain how feedback improves stability.", "topic": "control systems", "type": "technical"},
        ],
        "hard": [{"q": "Problem Solving: Analyze a simple RLC circuit under sinusoidal excitation and determine impedance, phase angle, and resonance conditions.", "topic": "circuits", "type": "technical"}],
    },
    "iot_developer": {
        "beginner": [
            {"q": "What is IoT architecture and how do sensors, gateways, and cloud services interact?", "topic": "iot", "type": "technical"},
            {"q": "Explain the difference between Wi-Fi, Bluetooth, and MQTT in an IoT network.", "topic": "mqtt", "type": "technical"},
        ],
        "intermediate": [
            {"q": "How would you secure an ESP32-based temperature monitoring device for cloud connectivity?", "topic": "esp32", "type": "technical"},
            {"q": "Describe how you would handle sensor calibration and data validation in an edge device.", "topic": "sensors", "type": "technical"},
        ],
        "advanced": [
            {"q": "Design an IoT pipeline from sensor acquisition to edge processing and final cloud dashboards.", "topic": "iot", "type": "technical"},
        ],
        "hard": [{"q": "Coding: Implement a lightweight MQTT publisher/subscriber example for an ESP32 sensor node in C++.", "topic": "mqtt", "type": "coding", "starter_code": "#include <WiFi.h>\n#include <PubSubClient.h>\n\nvoid setup() {\n  // Connect WiFi and MQTT\n}\n\nvoid loop() {\n  // Publish sensor data\n}"}],
    },
    "vlsi_engineer": {
        "beginner": [
            {"q": "What is the difference between combinational and sequential logic in digital design?", "topic": "digital electronics", "type": "technical"},
            {"q": "Explain flip-flops, latches, and setup/hold timing in FPGA design.", "topic": "timing analysis", "type": "technical"},
        ],
        "intermediate": [
            {"q": "How would you model a finite state machine in Verilog and verify it with a testbench?", "topic": "verilog", "type": "technical"},
            {"q": "Explain the importance of timing closure and clock skew in RTL design.", "topic": "rtl", "type": "technical"},
        ],
        "advanced": [
            {"q": "Describe the design flow from RTL to synthesis, place-and-route, and verification for a digital block.", "topic": "verification", "type": "technical"},
        ],
        "hard": [{"q": "Coding/Design: Write a Verilog module for a 4-bit binary counter with an enable and reset signal.", "topic": "verilog", "type": "coding", "starter_code": "module counter4(\n    input clk,\n    input rst,\n    input en,\n    output reg [3:0] q\n);\n\nendmodule"}],
    },
    "telecom_engineer": {
        "beginner": [
            {"q": "What is modulation and why is it needed in communication systems?", "topic": "communication systems", "type": "technical"},
            {"q": "Explain the difference between analog and digital signals in communication systems.", "topic": "signals", "type": "technical"},
        ],
        "intermediate": [
            {"q": "How do SNR and bandwidth affect the quality of a wireless transmission link?", "topic": "wireless", "type": "technical"},
            {"q": "Explain the role of protocols and layering in networking and telecom systems.", "topic": "networking", "type": "technical"},
        ],
        "advanced": [
            {"q": "Design a radio link budget for a wireless communication system and estimate path loss and received power.", "topic": "rf", "type": "technical"},
        ],
        "hard": [{"q": "Problem Solving: Derive the relationship between bandwidth, bit rate, and modulation scheme for a digital communication channel.", "topic": "communication systems", "type": "technical"}],
    },
    "robotics_engineer": {
        "beginner": [
            {"q": "What is the role of sensors and actuators in a robotic system?", "topic": "sensors", "type": "technical"},
            {"q": "How do feedback control loops help robots maintain accuracy and stability?", "topic": "control systems", "type": "technical"},
        ],
        "intermediate": [
            {"q": "Describe how you would integrate a motor controller, sensor feedback, and embedded logic in an autonomous robot.", "topic": "automation", "type": "technical"},
            {"q": "How does ROS help in robotics software development and modularity?", "topic": "ros", "type": "technical"},
        ],
        "advanced": [
            {"q": "Design a path-planning and obstacle-avoidance framework for a mobile robot using sensor input and control logic.", "topic": "robotics", "type": "technical"},
        ],
        "hard": [{"q": "Coding: Implement a simple PID controller in Python or C++ for motor speed regulation.", "topic": "control systems", "type": "coding", "starter_code": "class PID:\n    def __init__(self, kp, ki, kd):\n        self.kp = kp\n        self.ki = ki\n        self.kd = kd\n\n    def update(self, error):\n        return 0"}],
    },
    "instrumentation_engineer": {
        "beginner": [
            {"q": "What is instrumentation and why are calibration and accuracy critical in process systems?", "topic": "measurement", "type": "technical"},
            {"q": "How do sensors and transmitters differ in instrumentation systems?", "topic": "sensors", "type": "technical"},
        ],
        "intermediate": [
            {"q": "Explain the role of signal conditioning and filtering in industrial measurement systems.", "topic": "signals", "type": "technical"},
            {"q": "How would you troubleshoot a noisy instrumentation loop in a plant environment?", "topic": "control systems", "type": "behavioral"},
        ],
        "advanced": [
            {"q": "Design a PLC-based instrumentation architecture for monitoring temperature and pressure in a process plant.", "topic": "industrial automation", "type": "technical"},
        ],
        "hard": [{"q": "Problem Solving: Explain the sources of measurement error in an industrial sensor loop and suggest mitigation strategies.", "topic": "measurement", "type": "technical"}],
    },
}

ELECTRONICS_ELITE_QUESTIONS = [
    {
        "q": "A sealed equipment cabinet overheats intermittently, and its existing fan is controlled manually. Build an Arduino Uno solution that monitors cabinet temperature, controls the fan automatically, reports operating state, and enters a safe state if the sensor becomes invalid. It must tolerate noisy readings and avoid rapid fan switching.",
        "topic": "circuit design and fault handling",
        "type": "circuit",
        "challenge_id": "thermal_failsafe",
    },
    {
        "q": "A small motorized gate must stop before contacting an approaching object and remain controllable by an operator. Build an Arduino Uno solution for the gate, including an emergency stop and clear status indication. The distance sensor may time out, and the motor supply can introduce electrical noise.",
        "topic": "motor control and safety",
        "type": "circuit",
        "challenge_id": "motorized_gate",
    },
    {
        "q": "A workshop wants a standalone station that detects a person entering a restricted zone, sounds an alarm, displays system state, and requires deliberate acknowledgement before returning to monitoring. Design the Arduino Uno circuit and firmware for noisy sensor input, startup, and sensor-fault conditions.",
        "topic": "system integration and debugging",
        "type": "circuit",
        "challenge_id": "restricted_zone",
    },
]

ELECTRONICS_CIRCUIT_RUBRICS = {
    "thermal_failsafe": {
        "parts": {"thermistor": 1, "resistor": 2, "dc_motor": 1, "transistor": 1, "led": 1, "diode": 1, "battery": 1},
        "nets": [
            [("thermistor", 0, "signal"), ("uno", 0, "A0"), ("resistor", 0, "leg1")],
            [("thermistor", 0, "power"), ("uno", 0, "5V")],
            [("resistor", 0, "leg2"), ("uno", 0, "GND")],
            [("dc_motor", 0, "terminal1"), ("transistor", 0, "collector"), ("diode", 0, "anode")],
            [("dc_motor", 0, "terminal2"), ("battery", 0, "positive"), ("diode", 0, "cathode")],
            [("battery", 0, "negative"), ("uno", 0, "GND")],
            [("transistor", 0, "base"), ("uno", 0, "D9")],
            [("transistor", 0, "emitter"), ("uno", 0, "GND")],
            [("led", 0, "anode"), ("resistor", 1, "leg1")],
            [("resistor", 1, "leg2"), ("uno", 0, "D6")],
            [("led", 0, "cathode"), ("uno", 0, "GND")],
        ],
        "code_checks": [
            ("Arduino sketch structure", [r"\bvoid\s+setup\s*\(", r"\bvoid\s+loop\s*\("]),
            ("temperature acquisition", [r"analogRead\s*\("]),
            ("fan output control", [r"digitalWrite\s*\(", r"analogWrite\s*\("]),
            ("time-based sampling", [r"millis\s*\("]),
            ("invalid sensor handling", [r"1023|0\s*\)|isnan|isfinite|sensor.*(fault|valid|error)|fault.*sensor"]),
            ("noise / rapid-switching control", [r"hysteresis|average|filter|sample|threshold|deadband"]),
        ],
        "behavior_checks": [
            ("invalid sensor is detected", [r"1023|0\s*\)|isnan|isfinite|sensor.*fault"]),
            ("fan reaches a safe state", [r"fan|motor", r"low|off|stop|0"]),
            ("noisy input does not cause rapid switching", [r"hysteresis|average|filter|deadband"]),
            ("temperature controls fan state", [r"temperature|temp", r"[<>]\s*\d+|threshold"]),
        ],
    },
    "motorized_gate": {
        "parts": {"ultrasonic_sensor": 1, "motor_driver": 1, "dc_motor": 1, "pushbutton": 1, "led": 1, "battery": 1, "resistor": 1},
        "nets": [
            [("ultrasonic_sensor", 0, "trigger"), ("uno", 0, "D8")],
            [("ultrasonic_sensor", 0, "echo"), ("uno", 0, "D7")],
            [("motor_driver", 0, "input1"), ("uno", 0, "D5")],
            [("motor_driver", 0, "input2"), ("uno", 0, "D6")],
            [("motor_driver", 0, "enable"), ("uno", 0, "D9")],
            [("motor_driver", 0, "output1"), ("dc_motor", 0, "terminal1")],
            [("motor_driver", 0, "output2"), ("dc_motor", 0, "terminal2")],
            [("motor_driver", 0, "logicVcc"), ("uno", 0, "5V")],
            [("motor_driver", 0, "motorVcc"), ("battery", 0, "positive")],
            [("motor_driver", 0, "ground"), ("uno", 0, "GND")],
            [("pushbutton", 0, "signal"), ("uno", 0, "D2")],
            [("pushbutton", 0, "ground"), ("uno", 0, "GND")],
            [("led", 0, "anode"), ("resistor", 0, "leg1")],
            [("resistor", 0, "leg2"), ("uno", 0, "D4")],
            [("led", 0, "cathode"), ("uno", 0, "GND")],
            [("ultrasonic_sensor", 0, "vcc"), ("uno", 0, "5V")],
            [("ultrasonic_sensor", 0, "ground"), ("uno", 0, "GND")],
            [("battery", 0, "negative"), ("uno", 0, "GND")],
        ],
        "code_checks": [
            ("Arduino sketch structure", [r"\bvoid\s+setup\s*\(", r"\bvoid\s+loop\s*\("]),
            ("distance measurement", [r"pulseIn\s*\(", r"duration|echo"]),
            ("motor direction / stop control", [r"digitalWrite\s*\(", r"motor|in1|in2"]),
            ("emergency-stop response", [r"digitalRead\s*\(", r"stop|emergency|estop|e_stop"]),
            ("sensor timeout handling", [r"pulseIn\s*\([^;]*,|timeout|duration\s*==\s*0"]),
            ("noise / safe transitions", [r"millis\s*\(", r"deboun|state|brake|stop"]),
        ],
        "behavior_checks": [
            ("obstacle condition stops gate motion", [r"distance|range|cm", r"if\s*\([^)]*[<>]", r"stop|brake|low"]),
            ("emergency stop disables motor output", [r"emergency|estop|e_stop|stop", r"digitalread\s*\(", r"low|stopmotor|brake"]),
            ("sensor timeout fails safe", [r"timeout|duration\s*==\s*0", r"low|stopmotor|brake"]),
            ("state changes are time-managed", [r"millis\s*\(", r"state"]),
        ],
    },
    "restricted_zone": {
        "parts": {"ultrasonic_sensor": 1, "lcd_display": 1, "buzzer": 1, "pushbutton": 1, "led": 1, "resistor": 1},
        "nets": [
            [("ultrasonic_sensor", 0, "trigger"), ("uno", 0, "D9")],
            [("ultrasonic_sensor", 0, "echo"), ("uno", 0, "D10")],
            [("buzzer", 0, "positive"), ("uno", 0, "D3")],
            [("buzzer", 0, "negative"), ("uno", 0, "GND")],
            [("pushbutton", 0, "signal"), ("uno", 0, "D2")],
            [("pushbutton", 0, "ground"), ("uno", 0, "GND")],
            [("ultrasonic_sensor", 0, "vcc"), ("uno", 0, "5V")],
            [("lcd_display", 0, "sda"), ("uno", 0, "SDA")],
            [("lcd_display", 0, "scl"), ("uno", 0, "SCL")],
            [("lcd_display", 0, "vcc"), ("uno", 0, "5V")],
            [("lcd_display", 0, "ground"), ("uno", 0, "GND")],
            [("led", 0, "anode"), ("resistor", 0, "leg1")],
            [("resistor", 0, "leg2"), ("uno", 0, "D6")],
            [("led", 0, "cathode"), ("uno", 0, "GND")],
            [("ultrasonic_sensor", 0, "ground"), ("uno", 0, "GND")],
            [("lcd_display", 0, "sda"), ("uno", 0, "SDA")],
            [("lcd_display", 0, "scl"), ("uno", 0, "SCL")],
            [("lcd_display", 0, "vcc"), ("uno", 0, "5V")],
            [("lcd_display", 0, "ground"), ("uno", 0, "GND")],
        ],
        "code_checks": [
            ("Arduino sketch structure", [r"\bvoid\s+setup\s*\(", r"\bvoid\s+loop\s*\("]),
            ("distance measurement", [r"pulseIn\s*\(", r"duration|echo"]),
            ("alarm and status outputs", [r"digitalWrite\s*\(", r"buzzer|tone\s*\(", r"led"]),
            ("display integration", [r"lcd|display|liquidcrystal|print\s*\("]),
            ("acknowledgement handling", [r"digitalRead\s*\(", r"acknow|reset|button|clear"]),
            ("fault / noise handling", [r"timeout|duration\s*==\s*0|fault|invalid", r"millis\s*\(|deboun|average|filter"]),
        ],
        "behavior_checks": [
            ("zone entry activates alarm", [r"distance|zone|threshold", r"buzzer|tone\s*\(|alarm", r"if\s*\("]),
            ("alarm remains latched until acknowledgement", [r"latch|alarmstate|state", r"acknow|reset|button"]),
            ("startup and sensor faults are handled", [r"setup|fault|timeout|invalid", r"low|safe|alarm"]),
            ("system state is reported on display", [r"lcd|display|liquidcrystal", r"print\s*\("]),
        ],
    },
}


def pick_questions(role_id: str, difficulty: str, count: int = 5, missing_skills: list = None):
    if role_id == "electronics_engineer" and difficulty == "hard":
        return ELECTRONICS_ELITE_QUESTIONS[:count]
    role_id = role_id if role_id in QUESTION_BANK else "frontend"
    bank = QUESTION_BANK[role_id]
    order = ["beginner", "intermediate", "advanced", "hard"]
    
    # If user selected "hard", prioritize hard DSA coding questions!
    if difficulty in ["hard", "advanced"]:
        hard_pool = list(bank.get("hard", []))
        adv_pool = list(bank.get("advanced", []))
        pool = hard_pool + adv_pool
        if len(pool) < count:
            pool += list(bank.get("intermediate", []))
        return pool[:count]

    idx = order.index(difficulty) if difficulty in order else 0
    pool = list(bank.get(order[idx], []))
    if idx + 1 < len(order):
        pool += bank.get(order[idx + 1], [])[:2]

    if len(pool) < count:
        for lvl in order:
            for q in bank.get(lvl, []):
                if q not in pool:
                    pool.append(q)

    if missing_skills:
        pool.sort(key=lambda q: 0 if q["topic"] in missing_skills else 1)
    return pool[:count]


def evaluate_circuit_challenge(question: dict, submission: dict, code: str) -> dict:
    rubric = ELECTRONICS_CIRCUIT_RUBRICS.get(question.get("challenge_id"), {})
    components = submission.get("components", []) if isinstance(submission, dict) else []
    connections = submission.get("connections", []) if isinstance(submission, dict) else []
    source = (code or "").strip()
    code_lower = source.lower()

    challenge_id = question.get("challenge_id", "")
    challenge_terms = {
        "thermal_failsafe": ["temperature", "thermistor", "fan", "sensor", "fault", "hysteresis", "analogread", "millis", "safe", "threshold"],
        "motorized_gate": ["motor", "gate", "distance", "ultrasonic", "echo", "emergency", "stop", "button", "timeout", "brake"],
        "restricted_zone": ["zone", "alarm", "sensor", "distance", "buzzer", "lcd", "button", "acknowledge", "display", "restricted"],
    }.get(challenge_id, [])
    challenge_hit_count = sum(1 for term in challenge_terms if term in code_lower)
    generic_debug_output = bool(re.search(r"\b(?:print|println|printf|serial\.println|console\.log)\s*\(", code_lower))
    if source and generic_debug_output and challenge_hit_count == 0:
        return {
            "score": 0,
            "correctness": 0,
            "relevance": 0,
            "completeness": 0,
            "structure": 0,
            "clarity": 0,
            "circuit": 0,
            "component_selection": 0,
            "code": 0,
            "logic": 0,
            "behavior": 0,
            "firmware_valid": False,
            "wired_pin_match": False,
            "unwired_code_pins": [],
            "feedback": "This firmware is generic debug output and does not address the asked circuit challenge.",
            "improvements": [
                "Implement the actual hardware behavior from the scenario.",
                "Tie the logic to the sensor, actuator, and safety requirements in the prompt.",
                "Use challenge-specific thresholds, state changes, and fault handling instead of placeholder prints."
            ],
        }

    component_by_id = {item.get("id"): item for item in components if isinstance(item, dict) and item.get("id")}
    counts = {}
    for item in component_by_id.values():
        counts[item.get("kind")] = counts.get(item.get("kind"), 0) + 1
    required_parts = rubric.get("parts", {})
    part_checks = len(required_parts)
    part_hits = sum(counts.get(kind, 0) >= needed for kind, needed in required_parts.items())
    selection_score = round(100 * part_hits / max(1, part_checks))

    parent = {}

    def find(endpoint):
        parent.setdefault(endpoint, endpoint)
        if parent[endpoint] != endpoint:
            parent[endpoint] = find(parent[endpoint])
        return parent[endpoint]

    def union(first, second):
        parent[find(first)] = find(second)

    for wire in connections:
        if not isinstance(wire, dict):
            continue
        first, second = wire.get("from"), wire.get("to")
        if isinstance(first, str) and isinstance(second, str):
            union(first, second)

    def find_component(kind, occurrence):
        matches = [item for item in component_by_id.values() if item.get("kind") == kind]
        return matches[occurrence].get("id") if occurrence < len(matches) else None

    net_checks = rubric.get("nets", [])
    net_hits = 0
    for net in net_checks:
        endpoints = []
        for kind, occurrence, pin in net:
            component_id = find_component(kind, occurrence)
            if component_id is None:
                endpoints = []
                break
            endpoints.append(f"{component_id}.{pin}")
        if len(endpoints) > 1 and all(endpoint in parent for endpoint in endpoints):
            roots = {find(endpoint) for endpoint in endpoints}
            net_hits += len(roots) == 1
    circuit_score = round(100 * net_hits / max(1, len(net_checks)))

    source_without_literals = re.sub(r'"(?:\\.|[^"\\])*"|\'(?:\\.|[^\'\\])*\'', '""', source)
    source_without_comments = re.sub(r"//[^\n]*|/\*[\s\S]*?\*/", "", source_without_literals)
    delimiter_stack = []
    closing_delimiters = {")": "(", "]": "[", "}": "{"}
    delimiters_balanced = True
    for character in source_without_comments:
        if character in "([{":
            delimiter_stack.append(character)
        elif character in closing_delimiters:
            if not delimiter_stack or delimiter_stack.pop() != closing_delimiters[character]:
                delimiters_balanced = False
                break
    delimiters_balanced = delimiters_balanced and not delimiter_stack
    has_sketch_structure = bool(
        re.search(r"\bvoid\s+setup\s*\(", source, re.IGNORECASE)
        and re.search(r"\bvoid\s+loop\s*\(", source, re.IGNORECASE)
        and re.search(r"\bpinMode\s*\(", source, re.IGNORECASE)
        and re.search(r"\b(?:digitalWrite|digitalRead|analogWrite|analogRead|pulseIn|tone)\s*\(", source, re.IGNORECASE)
    )
    firmware_issues = []
    if not source:
        firmware_issues.append("Arduino sketch is empty.")
    elif not has_sketch_structure:
        firmware_issues.append("Arduino sketch is incomplete: required program structure or hardware I/O is missing.")
    if source and not delimiters_balanced:
        firmware_issues.append("Arduino sketch has unmatched or misordered braces, brackets, or parentheses.")

    pin_aliases = {
        name.lower(): value.upper()
        for name, value in re.findall(
            r"(?:#\s*define\s+|(?:const\s+)?(?:byte|int|uint8_t)\s+)([A-Za-z_]\w*)\s*(?:=\s*|\s+)(A\d+|\d+)",
            source,
            re.IGNORECASE,
        )
    }
    wired_uno_pins = set()
    for endpoint in parent:
        if not endpoint.startswith("uno."):
            continue
        pin = endpoint.split(".", 1)[1]
        if not re.fullmatch(r"(?:D\d+|A\d+)", pin, re.IGNORECASE):
            continue
        if any(
            other != endpoint
            and not other.startswith("uno.")
            and find(other) == find(endpoint)
            for other in parent
        ):
            wired_uno_pins.add(pin.upper())

    used_uno_pins = set()
    for match in re.finditer(
        r"\b(pinMode|digitalWrite|digitalRead|analogWrite|analogRead|pulseIn|tone)\s*\(\s*([A-Za-z_]\w*|\d+)",
        source,
        re.IGNORECASE,
    ):
        method, argument = match.groups()
        pin = pin_aliases.get(argument.lower(), argument.upper())
        if pin.isdigit():
            pin = f"A{pin}" if method.lower() == "analogread" else f"D{pin}"
        elif pin.startswith("D") and pin[1:].isdigit():
            pin = pin.upper()
        elif pin.startswith("A") and pin[1:].isdigit():
            pin = pin.upper()
        else:
            continue
        used_uno_pins.add(pin)
    unwired_code_pins = sorted(used_uno_pins - wired_uno_pins)
    if unwired_code_pins:
        firmware_issues.append(f"Firmware uses Uno pin(s) without a connected component: {', '.join(unwired_code_pins)}.")

    code_checks = rubric.get("code_checks", [])
    passed_checks = sum(
        1 for _, check_patterns in code_checks
        if all(re.search(pattern, code_lower, re.IGNORECASE) for pattern in check_patterns)
    )
    code_score = round(100 * passed_checks / max(1, len(code_checks)))
    logic_score = round(100 * sum(
        any(re.search(pattern, code_lower, re.IGNORECASE) for pattern in alternatives)
        for _, alternatives in code_checks[2:]
    ) / max(1, len(code_checks[2:])))
    behavior_checks = rubric.get("behavior_checks", [])
    passed_behaviors = [
        label for label, patterns in behavior_checks
        if all(re.search(pattern, code_lower, re.IGNORECASE) for pattern in patterns)
    ]
    behavior_score = round(100 * len(passed_behaviors) / max(1, len(behavior_checks)))

    score = round(0.15 * selection_score + 0.35 * circuit_score + 0.25 * code_score + 0.15 * logic_score + 0.10 * behavior_score)
    firmware_valid = bool(source and has_sketch_structure and delimiters_balanced)
    if not firmware_valid:
        code_score = min(code_score, 15)
        logic_score = min(logic_score, 15)
        behavior_score = 0
        score = min(score, 25)
    if unwired_code_pins:
        code_score = min(code_score, 25)
        score = min(score, 40)
    improvements = []
    if part_hits < part_checks:
        missing = [kind.replace("_", " ") for kind, needed in required_parts.items() if counts.get(kind, 0) < needed]
        improvements.append(f"Component selection is incomplete: {', '.join(missing)}.")
    if net_hits < len(net_checks):
        improvements.append(f"{len(net_checks) - net_hits} required electrical net(s) are missing or incorrect.")
    for label, alternatives in code_checks:
        if not any(re.search(pattern, code_lower, re.IGNORECASE) for pattern in alternatives):
            improvements.append(f"Firmware evidence is missing for: {label.lower()}.")
    for label, _ in behavior_checks:
        if label not in passed_behaviors:
            improvements.append(f"Scenario behavior not demonstrated: {label.lower()}.")
    improvements.extend(firmware_issues)
    if not improvements:
        improvements.append("All evaluated checks passed. Review the fault and transition cases for additional robustness.")

    return {
        "score": score,
        "correctness": circuit_score,
        "relevance": selection_score,
        "completeness": code_score,
        "structure": logic_score,
        "clarity": behavior_score,
        "circuit": circuit_score,
        "component_selection": selection_score,
        "code": code_score,
        "logic": logic_score,
        "behavior": behavior_score,
        "firmware_valid": firmware_valid,
        "wired_pin_match": not unwired_code_pins,
        "unwired_code_pins": unwired_code_pins,
        "feedback": f"Automated rubric: {net_hits}/{len(net_checks)} circuit nets, {part_hits}/{part_checks} component groups, {passed_checks}/{len(code_checks)} firmware checks, and {len(passed_behaviors)}/{len(behavior_checks)} source-level behavior checks passed. Firmware was not compiled or run on physical hardware.",
        "improvements": improvements,
    }

KEYWORDS_BY_TOPIC = {
    "javascript": ["var", "let", "const", "scope", "hoisting", "closure", "prototype", "promise", "async"],
    "css": ["margin", "padding", "border", "box", "flex", "grid", "responsive", "media", "viewport"],
    "react": ["virtual dom", "component", "state", "props", "reconciliation", "hook", "diff", "render"],
    "performance": ["lcp", "cls", "inp", "lazy", "code split", "cache", "cdn", "vitals", "bundle"],
    "system design": ["load balancer", "cache", "queue", "sharding", "replica", "database", "latency", "scale", "ttl", "lock"],
    "nextjs": ["ssr", "ssg", "server component", "client", "app router", "hydration"],
    "sql": ["index", "join", "primary key", "foreign key", "transaction", "query plan", "btree", "partition"],
    "rest": ["get", "post", "put", "delete", "stateless", "resource", "endpoint", "status code", "http"],
    "os": ["memory", "cpu", "context switch", "mutex", "shared", "process", "thread", "concurrency"],
    "kafka": ["partition", "consumer group", "offset", "topic", "producer", "broker", "event"],
    "statistics": ["mean", "median", "distribution", "p-value", "confidence", "hypothesis", "variance", "outlier"],
    "analytics": ["kpi", "cohort", "retention", "funnel", "conversion", "churn", "metric"],
    "python": ["gil", "list", "tuple", "async", "await", "generator", "yield", "memory", "decorator", "heap"],
    "ml": ["overfitting", "bias", "variance", "precision", "recall", "auc", "f1", "validation", "regularization", "softmax"],
    "llm": ["fine-tune", "prompt", "embedding", "context", "token", "lora", "rag", "transformer"],
    "behavioral": ["situation", "task", "action", "result", "learned", "metric", "team", "challenge"],
    "accessibility": ["aria", "contrast", "keyboard", "screen reader", "semantic", "wcag", "focus"],
    "java": ["jvm", "jre", "jdk", "bytecode", "garbage", "heap", "stack", "lock", "thread"],
    "spring": ["bean", "injection", "context", "annotation", "boot", "ioc"],
    "data modeling": ["schema", "mart", "warehouse", "normalize", "denormalize", "dbt", "fact", "dimension"],
    "fullstack": ["form", "state", "api", "database", "auth", "token", "payload", "trie"],
    "web": ["origin", "header", "preflight", "cross", "cors", "options"],
    "dsa": ["time complexity", "space complexity", "o(1)", "o(n)", "o(log n)", "hash", "tree", "node", "heap", "stack", "queue", "graph", "pointer", "return"],
}

def evaluate_answer(question: dict, answer: str, language: str = "javascript") -> dict:
    ans = (answer or "").strip()
    if not ans:
        return {
            "score": 0,
            "correctness": 0, "relevance": 0, "completeness": 0, "structure": 0, "clarity": 0,
            "feedback": "No answer provided.",
            "improvements": ["Attempt an answer even if unsure; explain your thought process."],
        }

    correctness = 0
    relevance = 0
    completeness = 0
    structure = 0
    clarity = 0

    ans_lower = ans.lower()
    words = ans.split()
    length = len(words)
    topic = question.get("topic", "")
    is_coding = question.get("type") == "coding" or "dsa" in topic or "coding" in question.get("q", "").lower()
    language = (language or "javascript").lower()

    non_substantive_patterns = [
        r"\b(i\s+(don['’]?t|do not|cannot|can['’]?t|am)\s+(know|understand|answer))\b",
        r"\b(not sure|no idea|not certain|no clue|can['’]?t recall|unable to answer)\b",
    ]
    is_non_substantive = any(re.search(pattern, ans_lower) for pattern in non_substantive_patterns)

    if is_non_substantive:
        return {
            "score": 5,
            "correctness": 0,
            "relevance": 5,
            "completeness": 0,
            "structure": 0,
            "clarity": 5,
            "feedback": "This answer does not provide enough substantive content to be considered valid. Please explain your reasoning, a concrete example, or a technical approach.",
            "improvements": [
                "State the core concept clearly, even if you are unsure.",
                "Explain your approach, trade-off, or starting point.",
                "If you do not know, say what you would check first and why."
            ],
        }

    has_debug_output = bool(re.search(r"\b(?:print|println|printf|console\.log|serial\.println)\s*\(", ans_lower))
    has_algorithmic_structure = bool(re.search(r"\b(?:if|for|while|return|def|class|function|append|map|filter|reduce|sort|heap|queue|stack|tree|graph|dfs|bfs|hash|node)\b", ans_lower))
    challenge_terms_in_answer = any(token in ans_lower for token in ["palindrome", "reverse", "array", "string", "list", "queue", "stack", "tree", "graph", "sort", "search", "dfs", "bfs", "hash", "deque", "node", "max", "min", "count", "sum", "temperature", "fan", "sensor", "motor", "gate", "distance", "alarm", "zone", "lcd", "buzzer", "button", "thermistor", "resistor", "transistor", "diode", "battery"])
    if is_coding and has_debug_output and not has_algorithmic_structure and not challenge_terms_in_answer:
        return {
            "score": 0,
            "correctness": 0,
            "relevance": 0,
            "completeness": 0,
            "structure": 0,
            "clarity": 0,
            "feedback": "This code is generic debug output, not a valid solution to the asked problem.",
            "improvements": [
                "Implement logic that directly addresses the prompt.",
                "Use the required data structures, control flow, or hardware behavior from the question.",
                "Explain the algorithm or circuit decision instead of printing placeholders."
            ],
        }

    # Strict DSA gate: if the answer is effectively unrelated to the problem, reject it completely.
    has_code_syntax = bool(re.search(r"(\bdef\b|\bfunction\b|\bclass\b|=>|\{|\}|;\s*$|\bif\b|\bfor\b|\bwhile\b|\breturn\b|\bprint\s*\(|\bprintf\s*\(|\bconsole\.log\s*\()", ans, re.MULTILINE))
    irrelevant_dsa = is_coding and (
        len(ans.strip()) < 25
        or ("hello world" in ans_lower and not any(token in ans_lower for token in ["palindrome", "reverse", "array", "string", "list", "queue", "stack", "tree", "graph", "sort", "search", "dfs", "bfs", "hash", "deque", "node", "max", "min", "count", "sum", "return", "if ", "for ", "while ", "def ", "class ", "function "]))
        or (not has_code_syntax and not any(token in ans_lower for token in ["array", "string", "list", "queue", "stack", "tree", "graph", "sort", "search", "dfs", "bfs", "hash", "node", "return", "if ", "for ", "while ", "def ", "class ", "function "]))
    )
    if irrelevant_dsa:
        return {
            "score": 0,
            "correctness": 0,
            "relevance": 0,
            "completeness": 0,
            "structure": 0,
            "clarity": 0,
            "feedback": "This solution is not relevant to the asked problem and does not demonstrate algorithmic reasoning.",
            "improvements": [
                "Implement logic that directly addresses the prompt.",
                "Use data structures or control flow relevant to the problem.",
                "Explain the reasoning and edge cases behind the algorithm."
            ],
        }

    q_text = (question.get("q") or "") + " " + (topic or "")
    problem_terms = set(re.findall(r"[a-zA-Z]{4,}", q_text.lower()))
    problem_terms -= {"dsa", "coding", "implement", "problem", "solution", "write", "given", "using", "from", "with", "your", "return", "find", "check", "function"}
    topic_hits = sum(1 for term in problem_terms if term in ans_lower)

    kws = list(KEYWORDS_BY_TOPIC.get(topic, []))
    if is_coding:
        kws.extend(["class", "def", "function", "return", "self", "this", "o(1)", "o(n)", "while", "for", "if", "node", "array", "list", "hash", "queue", "stack", "tree", "graph", "sort", "search", "dfs", "bfs", "heap"])

    language_tokens = {
        "python": ["def ", "return ", "if ", "for ", "while ", "len(", "append(", "pop(", "sorted(", "range(", "class ", "self", "None"],
        "java": ["class ", "public ", "static ", "main", "new ", "return ", "for ", "while ", "if ", "arraylist", "hashmap", "system.out.println", "list<", "map<"],
        "c": ["#include", "int main", "printf(", "scanf(", "malloc(", "for ", "while ", "if ", "return ", "struct ", "typedef"],
        "c++": ["#include", "using namespace std", "cout", "cin", "vector<", "map<", "unordered_map", "class ", "if ", "for ", "while ", "return "],
        "javascript": ["function ", "const ", "let ", "=>", "if ", "for ", "while ", "return ", "array.isarray", "map(", "filter(", "reduce(", "class "]
    }.get(language, [])

    code_like_tokens = [
        "def ", "class ", "function ", "=>", "if ", "for ", "while ", "return ", "print(", "console.log(", "printf(", "scanf(", "cout", "cin", "append(", "map(", "sort(", "heap", "queue", "stack", "tree", "graph", "node", "dfs", "bfs", "hash" 
    ]

    hits = sum(1 for k in kws if k in ans_lower)
    lang_hits = sum(1 for token in language_tokens if token in ans_lower)
    code_hits = sum(1 for token in code_like_tokens if token in ans_lower)
    has_complexity_mention = any(c in ans_lower for c in ["o(1)", "o(n)", "o(log", "time complexity", "space complexity"])
    simple_print_only = bool(re.search(r"^(?:\s*print\s*\(|\s*console\.log\s*\(|\s*printf\s*\()", ans_lower)) and not any(token in ans_lower for token in ["for ", "while ", "if ", "return ", "def ", "class ", "function ", "sort(", "heap", "queue", "stack", "tree", "graph", "dfs", "bfs", "map(", "filter(", "reduce(", "append(", "len(", "hash", "node", "leetcode"]) and "hello" in ans_lower

    if is_coding:
        if simple_print_only:
            correctness = 10
            relevance = 18
            completeness = 12
            structure = 20
            clarity = 28
        else:
            correctness = min(100, 25 + 10 * max(hits, lang_hits, code_hits) + 15 * min(topic_hits, 4))
            relevance = min(100, 30 + 12 * max(hits, lang_hits, code_hits) + 12 * min(topic_hits, 4))
            completeness = min(100, 35 + int(length * 1.3))
            structure = 90 if (has_code_syntax and (has_complexity_mention or code_hits >= 3 or topic_hits > 0)) else (75 if has_code_syntax else 35)
            clarity = 90 if length >= 25 else 65

        if has_code_syntax and not simple_print_only and (topic_hits > 0 or lang_hits >= 2 or code_hits >= 3):
            correctness = max(correctness, 85)
            relevance = max(relevance, 85)
            completeness = max(completeness, 80)
            structure = max(structure, 80)
            clarity = max(clarity, 80)
    else:
        is_behavioral = question.get("type") == "behavioral"
        has_star = any(w in ans_lower for w in ["situation", "action", "result", "task", "outcome"])
        correctness = 75 if hits > 0 else 30
        if is_behavioral and has_star:
            structure = 85
        elif any(sep in ans_lower for sep in [". ", "first", "then", "finally", "secondly"]):
            structure = 70
        else:
            structure = 45
        relevance = 90 if hits > 0 else (50 if length > 30 else 20)
        completeness = min(100, int(length * 1.6))
        clarity = 85 if 30 <= length <= 250 else (55 if length < 30 else 65)

    score = int(0.30 * correctness + 0.25 * relevance + 0.15 * completeness + 0.15 * structure + 0.15 * clarity)

    if is_coding and (simple_print_only or (hits == 0 and not has_code_syntax and length < 25)):
        score = min(score, 25)

    improvements = []
    if is_coding:
        if simple_print_only:
            improvements.append("Show actual algorithmic logic, not just a print statement. Use loops, conditionals, or data structures relevant to the problem.")
        if not has_code_syntax:
            improvements.append("Write runnable code with class/function declarations and edge-case handling.")
        if not has_complexity_mention:
            improvements.append("Explicitly state Big-O Time and Space complexity (e.g. O(1) lookup, O(N) space).")
        if hits < 3 and not simple_print_only:
            improvements.append(f"Incorporate core algorithmic primitives: {', '.join(kws[:4])}.")
    else:
        if hits < 2 and kws:
            improvements.append(f"Mention key technical concepts: {', '.join(kws[:4])}.")
        if length < 40:
            improvements.append("Add a concrete example, trade-off, or metric to strengthen the answer.")
        if question.get("type") == "behavioral" and structure < 75:
            improvements.append("Use the STAR framework: Situation, Task, Action, Result.")

    if not improvements:
        improvements.append("Solid answer -> try discussing potential concurrency pitfalls or alternative edge cases.")

    feedback = f"Detected {hits} relevant concept(s), {code_hits} code signals, {length} words, structure score {structure}."

    return {
        "score": score,
        "correctness": correctness,
        "relevance": relevance,
        "completeness": completeness,
        "structure": structure,
        "clarity": clarity,
        "feedback": feedback,
        "improvements": improvements,
    }

def next_difficulty(current: str, avg_score: float) -> str:
    order = ["beginner", "intermediate", "advanced", "hard"]
    i = order.index(current) if current in order else 0
    if avg_score >= 75 and i < len(order) - 1:
        return order[i + 1]
    if avg_score < 45 and i > 0:
        return order[i - 1]
    return current
