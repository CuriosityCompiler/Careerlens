"""Curated multi-domain resource catalog with verified official sources."""

RESOURCES = [
    # CSE / Software
    {"id": "r1", "domain": "Software", "targetRole": "frontend", "topic": "javascript", "skill": "javascript", "title": "MDN JavaScript Guide", "name": "MDN JavaScript Guide", "provider": "MDN", "type": "Documentation", "difficulty": "Beginner", "cost": "Free", "url": "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide", "description": "Core JavaScript concepts and language fundamentals from Mozilla's official docs.", "effort": "8 hours", "quality": 0.98},
    {"id": "r2", "domain": "Software", "targetRole": "frontend", "topic": "react", "skill": "react", "title": "React Docs", "name": "React Docs", "provider": "React", "type": "Documentation", "difficulty": "Beginner", "cost": "Free", "url": "https://react.dev/learn", "description": "Official React learning guide and component patterns.", "effort": "10 hours", "quality": 0.97},
    {"id": "r3", "domain": "Software", "targetRole": "backend", "topic": "python", "skill": "python", "title": "FastAPI Tutorial", "name": "FastAPI Tutorial", "provider": "FastAPI", "type": "Documentation", "difficulty": "Intermediate", "cost": "Free", "url": "https://fastapi.tiangolo.com/tutorial/", "description": "Official FastAPI tutorial for APIs, validation, and deployment.", "effort": "8 hours", "quality": 0.96},
    {"id": "r4", "domain": "Software", "targetRole": "backend", "topic": "database", "skill": "sql", "title": "PostgreSQL Tutorial", "name": "PostgreSQL Tutorial", "provider": "PostgreSQL", "type": "Documentation", "difficulty": "Intermediate", "cost": "Free", "url": "https://www.postgresql.org/docs/current/tutorial.html", "description": "Official PostgreSQL basics and SQL concepts.", "effort": "12 hours", "quality": 0.95},
    {"id": "r5", "domain": "Software", "targetRole": "aiml", "topic": "python", "skill": "python", "title": "Machine Learning Crash Course", "name": "Machine Learning Crash Course", "provider": "Google", "type": "Course", "difficulty": "Beginner", "cost": "Free", "url": "https://developers.google.com/machine-learning/crash-course", "description": "Conceptual ML foundations with practical examples.", "effort": "15 hours", "quality": 0.97},
    {"id": "r6", "domain": "Software", "targetRole": "fullstack", "topic": "node", "skill": "node", "title": "Node.js Learn", "name": "Node.js Learn", "provider": "Node.js", "type": "Documentation", "difficulty": "Beginner", "cost": "Free", "url": "https://nodejs.org/en/learn", "description": "Node.js guides for runtime, modules, and web services.", "effort": "10 hours", "quality": 0.94},
    {"id": "r7", "domain": "Software", "targetRole": "python_developer", "topic": "python", "skill": "python", "title": "Python Docs", "name": "Python Docs", "provider": "Python", "type": "Documentation", "difficulty": "Beginner", "cost": "Free", "url": "https://docs.python.org/3/tutorial/", "description": "Official Python tutorial covering language basics and modules.", "effort": "12 hours", "quality": 0.95},
    {"id": "r8", "domain": "Software", "targetRole": "java_developer", "topic": "java", "skill": "java", "title": "Java Tutorials", "name": "Java Tutorials", "provider": "Oracle", "type": "Documentation", "difficulty": "Beginner", "cost": "Free", "url": "https://docs.oracle.com/javase/tutorial/", "description": "Official Java learning path with core language tutorials.", "effort": "12 hours", "quality": 0.94},
    {"id": "r9", "domain": "Software", "targetRole": "data_analyst", "topic": "sql", "skill": "sql", "title": "Mode SQL Tutorial", "name": "Mode SQL Tutorial", "provider": "Mode", "type": "Tutorial", "difficulty": "Beginner", "cost": "Free", "url": "https://mode.com/sql-tutorial/", "description": "SQL basics, filtering, joins, and aggregation practice.", "effort": "10 hours", "quality": 0.94},
    {"id": "r10", "domain": "Software", "targetRole": "fullstack", "topic": "css", "skill": "css", "title": "freeCodeCamp Responsive Web Design", "name": "freeCodeCamp Responsive Web Design", "provider": "freeCodeCamp", "type": "Course", "difficulty": "Beginner", "cost": "Free", "url": "https://www.freecodecamp.org/learn/2022/responsive-web-design/", "description": "Responsive design fundamentals using HTML and CSS.", "effort": "25 hours", "quality": 0.96},

    # ECE / Embedded / EEE / IoT
    {"id": "r11", "domain": "Embedded", "targetRole": "embedded_systems_engineer", "topic": "microcontroller", "name": "Arduino Docs", "provider": "Arduino", "type": "Documentation", "difficulty": "Beginner", "cost": "Free", "effort": "3-5 hours", "url": "https://docs.arduino.cc/", "description": "Official Arduino reference for boards, libraries, and sketches."},
    {"id": "r12", "domain": "Embedded", "targetRole": "embedded_systems_engineer", "topic": "esp32", "name": "ESP32 Technical Reference", "provider": "Espressif", "type": "Documentation", "difficulty": "Intermediate", "cost": "Free", "effort": "6-8 hours", "url": "https://docs.espressif.com/projects/esp-idf/en/latest/esp32/", "description": "Official ESP32 hardware and IDF documentation."},
    {"id": "r13", "domain": "Embedded", "targetRole": "embedded_systems_engineer", "topic": "embedded c", "name": "Embedded C Programming", "provider": "NPTEL", "type": "Course", "difficulty": "Intermediate", "cost": "Free", "effort": "8-10 hours", "url": "https://nptel.ac.in/courses/106105193", "description": "NPTEL course covering embedded systems and microcontroller fundamentals."},
    {"id": "r14", "domain": "IoT", "targetRole": "iot_developer", "topic": "mqtt", "name": "MQTT Essentials", "provider": "HiveMQ", "type": "Tutorial", "difficulty": "Beginner", "cost": "Free", "effort": "2-4 hours", "url": "https://www.hivemq.com/mqtt-essentials/", "description": "Practical MQTT overview for IoT messaging and architecture."},
    {"id": "r15", "domain": "IoT", "targetRole": "iot_developer", "topic": "iot", "name": "AWS IoT Core Documentation", "provider": "AWS", "type": "Documentation", "difficulty": "Intermediate", "cost": "Freemium", "effort": "5-7 hours", "url": "https://docs.aws.amazon.com/iot/latest/developerguide/what-is-aws-iot.html", "description": "Official AWS IoT platform documentation for device connectivity and security."},
    {"id": "r16", "domain": "EEE/Electrical", "targetRole": "electrical_engineer", "topic": "power systems", "name": "NPTEL Electrical Machines", "provider": "NPTEL", "type": "Course", "difficulty": "Intermediate", "cost": "Free", "effort": "8-12 hours", "url": "https://nptel.ac.in/courses/108105053", "description": "Electrical machines and power fundamentals from NPTEL."},
    {"id": "r17", "domain": "EEE/Electrical", "targetRole": "electrical_engineer", "topic": "control systems", "name": "MIT OCW Signals and Systems", "provider": "MIT OpenCourseWare", "type": "Course", "difficulty": "Intermediate", "cost": "Free", "effort": "10-12 hours", "url": "https://ocw.mit.edu/courses/6-011-introduction-to-communication-information-and-signal-processing-spring-2010/", "description": "Academic material covering signals, systems, and control foundations."},
    {"id": "r18", "domain": "EEE/Electrical", "targetRole": "electrical_engineer", "topic": "power electronics", "name": "TI Power Electronics", "provider": "Texas Instruments", "type": "Documentation", "difficulty": "Intermediate", "cost": "Free", "effort": "4-6 hours", "url": "https://www.ti.com/power-management/power-supply-design/overview.html", "description": "Application notes and design guidance for power electronics."},

    # VLSI / Communication / Robotics
    {"id": "r19", "domain": "VLSI", "targetRole": "vlsi_engineer", "topic": "verilog", "name": "Verilog Tutorial", "provider": "FPGA and Verilog", "type": "Tutorial", "difficulty": "Beginner", "cost": "Free", "effort": "4-6 hours", "url": "https://www.chipverify.com/verilog", "description": "Beginner-friendly Verilog syntax, RTL, and simulation guidance."},
    {"id": "r20", "domain": "VLSI", "targetRole": "vlsi_engineer", "topic": "fpga", "name": "AMD Xilinx FPGA Documentation", "provider": "AMD/Xilinx", "type": "Documentation", "difficulty": "Intermediate", "cost": "Free", "effort": "6-8 hours", "url": "https://docs.amd.com/r/en-US/ug949-vivado-design-suite-user-guide/Introduction", "description": "Official FPGA design and HDL guidance documentation."},
    {"id": "r21", "domain": "Telecommunication", "targetRole": "telecom_engineer", "topic": "signals", "name": "MIT OCW Communication Systems", "provider": "MIT OpenCourseWare", "type": "Course", "difficulty": "Intermediate", "cost": "Free", "effort": "8-10 hours", "url": "https://ocw.mit.edu/courses/electrical-engineering-and-computer-science/6-011-introduction-to-communication-information-and-signal-processing-spring-2010/", "description": "Signals and communication system foundations from MIT OCW."},
    {"id": "r22", "domain": "Robotics/Mechatronics", "targetRole": "robotics_engineer", "topic": "ros", "name": "ROS 2 Documentation", "provider": "Robot Operating System", "type": "Documentation", "difficulty": "Intermediate", "cost": "Free", "effort": "6-8 hours", "url": "https://docs.ros.org/", "description": "Official ROS 2 docs for robotics software and communication."},
    {"id": "r23", "domain": "Instrumentation", "targetRole": "instrumentation_engineer", "topic": "control systems", "name": "MathWorks Control Systems", "provider": "MathWorks", "type": "Tutorial", "difficulty": "Intermediate", "cost": "Free", "effort": "5-7 hours", "url": "https://www.mathworks.com/help/control/", "description": "Example-driven control system modeling with MATLAB and Simulink."},

    # Extra general resources for expansion
    {"id": "r24", "domain": "Software", "targetRole": "frontend", "topic": "accessibility", "name": "MDN Accessibility Guide", "provider": "MDN", "type": "Documentation", "difficulty": "Beginner", "cost": "Free", "effort": "2-3 hours", "url": "https://developer.mozilla.org/en-US/docs/Learn/Accessibility", "description": "Official accessibility best practices for web interfaces."},
    {"id": "r25", "domain": "Software", "targetRole": "backend", "topic": "docker", "name": "Docker Get Started", "provider": "Docker", "type": "Tutorial", "difficulty": "Beginner", "cost": "Free", "effort": "3-5 hours", "url": "https://docs.docker.com/get-started/", "description": "Hands-on Docker tutorial for container basics and workflows."},
    {"id": "r26", "domain": "Software", "targetRole": "data_analyst", "topic": "statistics", "name": "Harvard Stat 110", "provider": "Harvard", "type": "Course", "difficulty": "Intermediate", "cost": "Free", "effort": "10-15 hours", "url": "https://projects.iq.harvard.edu/stat110/home", "description": "Free probability and statistics foundations from Harvard."},
]

for _resource in RESOURCES:
    _resource.setdefault("skill", _resource.get("topic") or _resource.get("skill") or "general")
    _resource.setdefault("title", _resource.get("name") or _resource.get("title") or _resource["skill"])


def get_resources_for_role(role_id: str = None, department: str = None, topic: str = None, difficulty: str = None, cost: str = None, resource_type: str = None, search: str = None):
    items = list(RESOURCES)
    if role_id:
        items = [r for r in items if r.get("targetRole") == role_id or not r.get("targetRole")]
    if department:
        dept = str(department).lower()
        items = [r for r in items if dept in str(r.get("domain", "")).lower() or dept in str(r.get("targetRole", "")).lower()]
    if topic:
        topic = topic.lower()
        items = [r for r in items if topic in str(r.get("topic", "")).lower() or topic in str(r.get("name", "")).lower()]
    if difficulty:
        items = [r for r in items if str(r.get("difficulty", "")).lower() == str(difficulty).lower()]
    if cost:
        items = [r for r in items if str(r.get("cost", "")).lower() == str(cost).lower()]
    if resource_type:
        items = [r for r in items if str(r.get("type", "")).lower() == str(resource_type).lower()]
    if search:
        q = search.lower()
        items = [r for r in items if q in str(r.get("name", "")).lower() or q in str(r.get("topic", "")).lower() or q in str(r.get("domain", "")).lower() or q in str(r.get("provider", "")).lower()]
    return items
