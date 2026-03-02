-- Pesos (ponderación)
insert into public.weights(target_role, component, weight) values
('DOCENTE','HETERO',0.40),
('DOCENTE','AUTO',0.10),
('DOCENTE','DIRECTIVO',0.20),
('DOCENTE','PAR',0.30),
('COORD_ASIGNATURA','DIRECTIVO',0.20),
('COORD_ASIGNATURA','PAR',0.30)
on conflict do nothing;

-- Cursos
insert into public.courses(code, modalidad) values ('CON01', 'PRESENCIAL') on conflict do nothing;
insert into public.courses(code, modalidad) values ('CON02', 'PRESENCIAL') on conflict do nothing;
insert into public.courses(code, modalidad) values ('CON03', 'PRESENCIAL') on conflict do nothing;
insert into public.courses(code, modalidad) values ('CON04', 'PRESENCIAL') on conflict do nothing;
insert into public.courses(code, modalidad) values ('CON05', 'PRESENCIAL') on conflict do nothing;
insert into public.courses(code, modalidad) values ('CON06', 'PRESENCIAL') on conflict do nothing;
insert into public.courses(code, modalidad) values ('COND01', 'DISTANCIA') on conflict do nothing;
insert into public.courses(code, modalidad) values ('COND02', 'DISTANCIA') on conflict do nothing;
insert into public.courses(code, modalidad) values ('COND03', 'DISTANCIA') on conflict do nothing;
insert into public.courses(code, modalidad) values ('COND04', 'DISTANCIA') on conflict do nothing;
insert into public.courses(code, modalidad) values ('COND05', 'DISTANCIA') on conflict do nothing;
insert into public.courses(code, modalidad) values ('EMP01', 'PRESENCIAL') on conflict do nothing;
insert into public.courses(code, modalidad) values ('EMP02', 'PRESENCIAL') on conflict do nothing;
insert into public.courses(code, modalidad) values ('EMP03', 'PRESENCIAL') on conflict do nothing;
insert into public.courses(code, modalidad) values ('EMP04', 'PRESENCIAL') on conflict do nothing;
insert into public.courses(code, modalidad) values ('EMP05', 'PRESENCIAL') on conflict do nothing;
insert into public.courses(code, modalidad) values ('EMP06', 'PRESENCIAL') on conflict do nothing;
insert into public.courses(code, modalidad) values ('EMPD01', 'DISTANCIA') on conflict do nothing;
insert into public.courses(code, modalidad) values ('EMPD02', 'DISTANCIA') on conflict do nothing;
insert into public.courses(code, modalidad) values ('EMPD03', 'DISTANCIA') on conflict do nothing;
insert into public.courses(code, modalidad) values ('EMPD04', 'DISTANCIA') on conflict do nothing;
insert into public.courses(code, modalidad) values ('EMPD05', 'DISTANCIA') on conflict do nothing;
insert into public.courses(code, modalidad) values ('PUB01', 'PRESENCIAL') on conflict do nothing;
insert into public.courses(code, modalidad) values ('PUB02', 'PRESENCIAL') on conflict do nothing;
insert into public.courses(code, modalidad) values ('PUB03', 'PRESENCIAL') on conflict do nothing;
insert into public.courses(code, modalidad) values ('PUB04', 'PRESENCIAL') on conflict do nothing;
insert into public.courses(code, modalidad) values ('PUB05', 'PRESENCIAL') on conflict do nothing;
insert into public.courses(code, modalidad) values ('PUBD01', 'DISTANCIA') on conflict do nothing;
insert into public.courses(code, modalidad) values ('PUBD02', 'DISTANCIA') on conflict do nothing;
insert into public.courses(code, modalidad) values ('PUBD03', 'DISTANCIA') on conflict do nothing;
insert into public.courses(code, modalidad) values ('PUBD04', 'DISTANCIA') on conflict do nothing;

-- Preguntas HETERO
insert into public.questions(instrument,item,dimension,question) values ('HETERO',1,'Planificación','¿Durante las primeras clases, el docente socializó con los estudiantes el sílabo y los criterios de evaluación de los aprendizajes?') on conflict do nothing;
insert into public.questions(instrument,item,dimension,question) values ('HETERO',2,'Planificación','¿El docente desarrolló sus clases en concordancia con los contenidos académicos y los resultados de aprendizaje establecidos en el sílabo?') on conflict do nothing;
insert into public.questions(instrument,item,dimension,question) values ('HETERO',3,'Planificación','¿El docente cumplió con el dictado de las clases presenciales y/o virtuales conforme a los horarios establecidos para el curso de nivelación?') on conflict do nothing;
insert into public.questions(instrument,item,dimension,question) values ('HETERO',4,'Planificación','¿El docente ejecutó las actividades académicas planificadas, tales como tutorías y/o trabajos autónomos, en los horarios programados?') on conflict do nothing;
insert into public.questions(instrument,item,dimension,question) values ('HETERO',5,'Planificación','¿El docente utilizó la bibliografía básica establecida en el sílabo y complementó con otros recursos académicos pertinentes?') on conflict do nothing;
insert into public.questions(instrument,item,dimension,question) values ('HETERO',6,'Preparación','¿El docente evidenció que sus conocimientos académicos y profesionales fueron acordes a los contenidos de la asignatura establecidos en el sílabo?') on conflict do nothing;
insert into public.questions(instrument,item,dimension,question) values ('HETERO',7,'Preparación','¿El docente respondió de manera pertinente y con fundamento académico a las preguntas formuladas por los estudiantes respecto a los contenidos de la asignatura?') on conflict do nothing;
insert into public.questions(instrument,item,dimension,question) values ('HETERO',8,'Metodología','¿El docente facilitó en los estudiantes el desarrollo de conocimientos, habilidades, destrezas, valores y actitudes en coherencia con los contenidos de la asignatura y en relación con los contextos social, político, económico y ambiental?') on conflict do nothing;
insert into public.questions(instrument,item,dimension,question) values ('HETERO',9,'Metodología','¿El docente empleó herramientas tecnológicas para favorecer el aprendizaje, la investigación formativa y la comunicación, fortaleciendo así la enseñanza de los contenidos académicos?') on conflict do nothing;
insert into public.questions(instrument,item,dimension,question) values ('HETERO',10,'Metodología','¿El docente proporcionó orientaciones claras sobre la forma, el contenido y las fuentes de consulta necesarias para el desarrollo de trabajos individuales y grupales?') on conflict do nothing;
insert into public.questions(instrument,item,dimension,question) values ('HETERO',11,'Metodología','¿El docente brindó retroalimentación oportuna a los(as) estudiantes respecto a las actividades asincrónicas o de trabajo autónomo?') on conflict do nothing;
insert into public.questions(instrument,item,dimension,question) values ('HETERO',12,'Evaluación','¿El docente aplicó las evaluaciones individuales, grupales, sumativa 1, sumativa 2 y de recuperación, de acuerdo con lo establecido en el sílabo?') on conflict do nothing;
insert into public.questions(instrument,item,dimension,question) values ('HETERO',13,'Evaluación','¿El docente entregó y registró las calificaciones dentro del plazo establecido?') on conflict do nothing;
insert into public.questions(instrument,item,dimension,question) values ('HETERO',14,'Ética','En el marco del desarrollo académico, ¿el docente mantuvo una actitud de respeto mutuo hacia los estudiantes?') on conflict do nothing;
insert into public.questions(instrument,item,dimension,question) values ('HETERO',15,'Ética','¿El docente evidenció, a través de sus actos y palabras, el cumplimiento de las normas éticas establecidas por la Universidad Central del Ecuador?') on conflict do nothing;

-- Preguntas AUTO
insert into public.questions(instrument,item,dimension,question) values ('AUTO',1,'Planificación','¿Durante las primeras clases analicé con los estudiantes la planificación microcurricular (sílabo), conforme a los lineamientos institucionales sobre clases presenciales/virtuales y evaluación de los aprendizajes?') on conflict do nothing;
insert into public.questions(instrument,item,dimension,question) values ('AUTO',2,'Cumplimiento','¿Cumplí con las clases presenciales y/o virtuales en los horarios establecidos por el Programa de Nivelación?') on conflict do nothing;
insert into public.questions(instrument,item,dimension,question) values ('AUTO',3,'Cumplimiento','¿Cumplí con las actividades académicas planificadas (tutorías y/o trabajos autónomos) en los horarios correspondientes?') on conflict do nothing;
insert into public.questions(instrument,item,dimension,question) values ('AUTO',4,'Docencia','¿Desarrollé las clases en función de los contenidos académicos y resultados de aprendizaje establecidos en la planificación microcurricular (sílabo)?') on conflict do nothing;
insert into public.questions(instrument,item,dimension,question) values ('AUTO',5,'Docencia','¿Utilicé la bibliografía básica y complementaria establecida en la planificación microcurricular (sílabo)?') on conflict do nothing;
insert into public.questions(instrument,item,dimension,question) values ('AUTO',6,'Docencia','¿Respondí de manera pertinente y académica a las preguntas formuladas por los(as) estudiantes sobre los contenidos de la asignatura?') on conflict do nothing;
insert into public.questions(instrument,item,dimension,question) values ('AUTO',7,'Docencia','¿Mis conocimientos académicos y profesionales estuvieron alineados con los objetivos y resultados de aprendizaje de la asignatura establecidos en el sílabo?') on conflict do nothing;
insert into public.questions(instrument,item,dimension,question) values ('AUTO',8,'Docencia','¿Logré que los estudiantes desarrollen conocimientos en concordancia con los contenidos académicos de la asignatura?') on conflict do nothing;
insert into public.questions(instrument,item,dimension,question) values ('AUTO',9,'TIC','¿Diseñé el aula virtual en Moodle UCE con información general, específica y materiales relacionados con los contenidos académicos de la asignatura?') on conflict do nothing;
insert into public.questions(instrument,item,dimension,question) values ('AUTO',10,'TIC','¿Utilicé de manera adecuada los recursos tecnológicos institucionales, como la plataforma Moodle UCE y Microsoft 365 (Teams, OneDrive), para impartir mis clases?') on conflict do nothing;
insert into public.questions(instrument,item,dimension,question) values ('AUTO',11,'TIC','¿Tuve que recurrir al uso de Zoom como recurso tecnológico no institucional para impartir mis clases?') on conflict do nothing;
insert into public.questions(instrument,item,dimension,question) values ('AUTO',12,'TIC','¿Tuve que recurrir al uso de Google Meet como recurso tecnológico no institucional para impartir mis clases?') on conflict do nothing;
insert into public.questions(instrument,item,dimension,question) values ('AUTO',13,'TIC','¿Planifiqué foros en la plataforma Moodle (aula virtual) como actividades asincrónicas de apoyo académico y supervisé la participación de los(as) estudiantes?') on conflict do nothing;
insert into public.questions(instrument,item,dimension,question) values ('AUTO',14,'TIC','¿Planifiqué chats en la plataforma Moodle (aula virtual) como actividades asincrónicas de apoyo académico y supervisé la participación de los(as) estudiantes?') on conflict do nothing;
insert into public.questions(instrument,item,dimension,question) values ('AUTO',15,'TIC','¿Planifiqué juegos en la plataforma Moodle (aula virtual) como actividades asincrónicas de apoyo académico y supervisé la participación de los(as) estudiantes?') on conflict do nothing;
insert into public.questions(instrument,item,dimension,question) values ('AUTO',16,'TIC','¿Planifiqué glosarios en la plataforma Moodle (aula virtual) como actividades asincrónicas de apoyo académico y supervisé la participación de los(as) estudiantes?') on conflict do nothing;
insert into public.questions(instrument,item,dimension,question) values ('AUTO',17,'TIC','¿Utilicé software técnico como tecnologías educativas especializadas en línea, en concordancia con los contenidos académicos de la asignatura?') on conflict do nothing;
insert into public.questions(instrument,item,dimension,question) values ('AUTO',18,'TIC','¿Utilicé aplicaciones educativas en línea como apoyo a los contenidos académicos de la asignatura establecidos en la planificación microcurricular (sílabo)?') on conflict do nothing;
insert into public.questions(instrument,item,dimension,question) values ('AUTO',19,'TIC','¿Grabé las clases virtuales con fines de conexión asincrónica, retroalimentación y estudio de los(as) estudiantes?') on conflict do nothing;
insert into public.questions(instrument,item,dimension,question) values ('AUTO',20,'Metodología','¿Proporcioné indicaciones claras sobre la forma, el contenido y las fuentes de consulta para el desarrollo de trabajos individuales y grupales?') on conflict do nothing;
insert into public.questions(instrument,item,dimension,question) values ('AUTO',21,'Metodología','¿Brindé retroalimentación oportuna a los trabajos autónomos e investigaciones grupales presentados por los(as) estudiantes?') on conflict do nothing;

-- Preguntas PAR
insert into public.questions(instrument,item,dimension,question) values ('PAR',1,'Gestión','¿El docente entregó el sílabo de la asignatura al inicio del semestre para conocimiento de la coordinación?') on conflict do nothing;
insert into public.questions(instrument,item,dimension,question) values ('PAR',2,'Gestión','¿El docente asistió a las reuniones virtuales de trabajo programadas por la Carrera?') on conflict do nothing;
insert into public.questions(instrument,item,dimension,question) values ('PAR',3,'Gestión','¿El docente mostró disposición para realizar actividades en equipo con sus compañeros de la Carrera en el entorno virtual?') on conflict do nothing;
insert into public.questions(instrument,item,dimension,question) values ('PAR',4,'Gestión','¿El docente participó en los cursos virtuales de capacitación organizados por la Carrera?') on conflict do nothing;
insert into public.questions(instrument,item,dimension,question) values ('PAR',5,'Gestión','¿El docente atendió y cumplió las sugerencias y disposiciones emitidas por la coordinación?') on conflict do nothing;
insert into public.questions(instrument,item,dimension,question) values ('PAR',6,'Evaluación','¿El docente registró las calificaciones en el SIIU dentro de los plazos establecidos en el calendario académico aprobado por el HCU?') on conflict do nothing;
insert into public.questions(instrument,item,dimension,question) values ('PAR',7,'Evaluación','¿El docente entregó oportunamente a los estudiantes las calificaciones de las evaluaciones formativas y sumativas aplicadas, antes del registro de notas en el SIIU, cumpliendo con los plazos establecidos?') on conflict do nothing;
insert into public.questions(instrument,item,dimension,question) values ('PAR',8,'Ética','¿El docente evidenció, a través de sus actos y palabras, respeto e identidad institucional con la Universidad Central del Ecuador?') on conflict do nothing;
insert into public.questions(instrument,item,dimension,question) values ('PAR',9,'Ética','¿El docente emitió criterios sobre el trabajo de las autoridades y demás docentes de la institución con el debido respeto y en apego a la ética académica y profesional?') on conflict do nothing;

-- Preguntas DIRECTIVO
insert into public.questions(instrument,item,dimension,question) values ('DIRECTIVO',1,'Sílabo','¿El docente planificó y entregó el sílabo de la asignatura, conforme a los lineamientos establecidos por la Coordinación de Nivelación de la UCE, al inicio del semestre para su revisión y aprobación?') on conflict do nothing;
insert into public.questions(instrument,item,dimension,question) values ('DIRECTIVO',2,'Gestión','¿El docente asistió a las reuniones de trabajo presenciales convocadas por la Coordinación de Nivelación?') on conflict do nothing;
insert into public.questions(instrument,item,dimension,question) values ('DIRECTIVO',3,'Trabajo en equipo','En el entorno presencial o virtual, ¿el docente participó activamente con sus compañeros en las actividades asignadas por la Coordinación de Nivelación?') on conflict do nothing;
insert into public.questions(instrument,item,dimension,question) values ('DIRECTIVO',4,'Capacitación','¿El docente asistió a los eventos de capacitación, presenciales o virtuales, planificados por la Dirección General Académica, la Dirección de Desarrollo Académico, los Centros o Institutos, o la Dirección de Aseguramiento de la Calidad?') on conflict do nothing;
insert into public.questions(instrument,item,dimension,question) values ('DIRECTIVO',5,'Cumplimiento','¿El docente cumplió con las disposiciones y resoluciones emitidas por la Dirección General Académica, la Facultad y la Coordinación de Nivelación?') on conflict do nothing;
insert into public.questions(instrument,item,dimension,question) values ('DIRECTIVO',6,'Evaluación','¿El docente registró las calificaciones en el SIIU dentro de los plazos establecidos en el calendario académico aprobado por la Dirección General Académica?') on conflict do nothing;
insert into public.questions(instrument,item,dimension,question) values ('DIRECTIVO',7,'Ética','¿El docente demostró respeto en sus relaciones interpersonales?') on conflict do nothing;
insert into public.questions(instrument,item,dimension,question) values ('DIRECTIVO',8,'Ética','¿El docente evidenció, a través de sus actos y palabras, respeto hacia la Universidad Central del Ecuador Facultad de Ciencias Administrativas, la Coordinación de Nivelación FCA y sus integrantes?') on conflict do nothing;

-- Coordinadores por asignatura (cargar coordinator_id cuando existan perfiles)
-- Ejemplo (después):
-- update public.coordinator_subjects set coordinator_id = '<uuid>' where asignatura='MATEMÁTICA';

insert into public.coordinator_subjects(asignatura, coordinator_id) values
('MATEMÁTICA', null),
('EXPRESIÓN ORAL Y ESCRITA', null),
('CONTABILIDAD', null),
('ADMINISTRACIÓN', null),
('ADMINISTRACIÓN PÚBLICA', null),
('EPU', null)
on conflict (asignatura) do nothing;
\n-- Roles fijos\ninsert into public.role_registry (email, role) values ('mysaltos@uce.edu.ec','COORD_NIVELACION') on conflict (email) do update set role=excluded.role;\n
