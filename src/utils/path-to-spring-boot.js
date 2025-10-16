import JSZip from "jszip";
import { saveAs } from "file-saver";

// Función para generar y descargar el proyecto Spring Boot como un archivo ZIP
export const generateAndDownloadZip = (
  classes,
  relationships = [],
  associations = [],
  projectName,
  foreignKeys = {},
  foreignKeysAssociations = {}
) => {
  console.log("Clases:", classes);
  console.log("Relaciones:", relationships);
  console.log("Asociaciones:", associations);
  console.log("Nombre del proyecto:", projectName);
  console.log("Claves foráneas:", foreignKeys);
  console.log("Claves foráneas de asociaciones:", foreignKeysAssociations);

  relationships.map((rel) => {
    if (rel.type === "--|>") {
      foreignKeys.push({
        class1: rel.from,
        class2: rel.to,
        foreignKey: rel.from,
      });
    }
  });

  console.log("Claves foráneas actualizadas:", foreignKeys);

  const zip = new JSZip();

  const allDataClass = classes.map((cls) => {
    return {
      name: cls.name,
      attributes: cls.attributes,
      model: [],
      dto: [],
      service: {
        imports: [],
        autowired: [],
        seters: cls.attributes.map((attr) => {
          return `${cls.name.toLowerCase()}.set${
            attr.charAt(0).toUpperCase() + attr.slice(1)
          }(${cls.name.toLowerCase()}DTO.get${
            attr.charAt(0).toUpperCase() + attr.slice(1)
          }());`;
        }),
        setAssociation: [],
        setRelationships: [],
      },
      controller: {
        importsAssociation: [],
        functionsAssociation: [],
      },
    };
  });

  const getDataRelationship = (rel, dataClass) => {
    // Verifica que 'rel' tenga las propiedades necesarias
    if (!rel || !rel.from || !rel.to || !rel.type) return "";

    // Extrae las propiedades con valores por defecto si es necesario
    const { from, to, class1Multiplicity = "", class2Multiplicity = "" } = rel;
    const targetClass = from === dataClass.name ? to : from;

    const includeForeignKey = foreignKeys.some(
      (fk) =>
        fk.class1 === from &&
        fk.class2 === to &&
        fk.foreignKey === dataClass.name
    );

    /* if (class1Multiplicity === "*" && class2Multiplicity === "*") { */
    if (
      (class1Multiplicity === "*" ||
        class1Multiplicity === "0..*" ||
        class1Multiplicity === "1..*") &&
      class2Multiplicity === "1"
    ) {
      if (dataClass.name === to) {
        dataClass.model.push(`@ManyToOne
    @JoinColumn(name = "${to.toLowerCase()}_id")
    @JsonIgnoreProperties("${from.toLowerCase()}s")
    private ${to} ${to.toLowerCase()}; \n `);

        dataClass.dto.push(`private Long ${to.toLowerCase()}Id; \n  `);

        dataClass.service.imports.push(
          `import ${packageName}.model.${to};
import ${packageName}.repository.${to}Repository;
          `
        );

        //* Asigna el autowired al servicio
        dataClass.service.autowired.push(
          `@Autowired
    private ${to}Repository ${to.toLowerCase()}Repository;`
        );

        //* Asigna el setRelationships al servicio
        dataClass.service.setRelationships.push(
          `${to} ${to.toLowerCase()} = ${to.toLowerCase()}Repository.findById(${dataClass.name.toLowerCase()}DTO.get${to}Id()).orElseThrow(() -> new IllegalArgumentException("No se encontró ${dataClass.name.toLowerCase()} con el id " + ${dataClass.name.toLowerCase()}DTO.get${to}Id()));
        ${dataClass.name.toLowerCase()}.set${to}(${to.toLowerCase()});`
        );
      } else {
        /* return `@OneToMany(mappedBy = "${to.toLowerCase()}")
        private Set<${from}> ${from.toLowerCase()}s;`; */
        dataClass.model
          .push(`@OneToMany(mappedBy = "${to.toLowerCase()}", fetch = FetchType.LAZY, cascade = CascadeType.ALL)
    @JsonIgnoreProperties("${to.toLowerCase()}s")
    private List<${from}> ${from.toLowerCase()}s; \n  `);
      }
    } else if (
      class1Multiplicity === "1" &&
      (class2Multiplicity === "*" ||
        class2Multiplicity === "0..*" ||
        class2Multiplicity === "1..*")
    ) {
      if (dataClass.name === from) {
        dataClass.model
          .push(`@OneToMany(mappedBy = "${from.toLowerCase()}", fetch = FetchType.LAZY, cascade = CascadeType.ALL)
    @JsonIgnoreProperties("${from.toLowerCase()}s")
    private List<${to}> ${to.toLowerCase()}s; \n  `);
      } else {
        dataClass.model.push(`@ManyToOne
    @JoinColumn(name = "${from.toLowerCase()}_id")
    @JsonIgnoreProperties("${to.toLowerCase()}s")
    private ${from} ${from.toLowerCase()}; \n `);

        dataClass.dto.push(`private Long ${from.toLowerCase()}Id; \n  `);

        dataClass.service.imports.push(
          `import ${packageName}.model.${from};
import ${packageName}.repository.${from}Repository;
          `
        );

        //* Asigna el autowired al servicio
        dataClass.service.autowired.push(
          `@Autowired
    private ${from}Repository ${from.toLowerCase()}Repository;`
        );

        //* Asigna el setRelationships al servicio
        dataClass.service.setRelationships.push(
          `${from} ${from.toLowerCase()} = ${from.toLowerCase()}Repository.findById(${dataClass.name.toLowerCase()}DTO.get${from}Id()).orElseThrow(() -> new IllegalArgumentException("No se encontró ${dataClass.name.toLowerCase()} con el id " + ${dataClass.name.toLowerCase()}DTO.get${from}Id()));
        ${dataClass.name.toLowerCase()}.set${from}(${from.toLowerCase()});`
        );
      }
    } else if (
      class1Multiplicity === "1" &&
      class2Multiplicity === "1" &&
      includeForeignKey
    ) {
      dataClass.model.push(`@OneToOne
    @JoinColumn(name = "${targetClass.toLowerCase()}_id")
    private ${targetClass} ${targetClass.toLowerCase()}; \n `);

      dataClass.dto.push(`private Long ${targetClass.toLowerCase()}Id; \n `);

      dataClass.service.imports.push(
        `import ${packageName}.model.${targetClass};
import ${packageName}.repository.${targetClass}Repository;
        `
      );

      //* Asigna el autowired al servicio
      dataClass.service.autowired.push(
        `@Autowired
    private ${targetClass}Repository ${targetClass.toLowerCase()}Repository;`
      );

      //* Asigna el setRelationships al servicio
      dataClass.service.setRelationships.push(
        `${targetClass} ${targetClass.toLowerCase()} = ${targetClass.toLowerCase()}Repository.findById(${dataClass.name.toLowerCase()}DTO.get${targetClass}Id()).orElseThrow(() -> new IllegalArgumentException("No se encontró ${dataClass.name.toLowerCase()} con el id " + ${dataClass.name.toLowerCase()}DTO.get${targetClass}Id()));
        ${dataClass.name.toLowerCase()}.set${targetClass}(${targetClass.toLowerCase()});`
      );
    } else {
      dataClass.model.push(`@OneToOne
    @JoinColumn(name = "${targetClass.toLowerCase()}_id")
    private ${targetClass} ${targetClass.toLowerCase()}; \n `);
    }
  };

  // Función para generar el código de la entidad Java en base a los atributos y relaciones
  const generateEntityCode = (
    className,
    attributes = [],
    /* associations = [], */
    model = []
  ) => {
    return `package ${packageName}.model;

import com.fasterxml.jackson.annotation.JsonInclude;
import jakarta.persistence.*;
import lombok.Data;
import java.io.Serializable;
import java.util.List;
import java.util.Set;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@Entity
@Data
@Table(name = "${
      className.toLowerCase() === "user" ? "users" : className.toLowerCase()
    }")
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ${className} implements Serializable {
    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE)
    private Long id;
    ${attributes.map((attr) => `private String ${attr};`).join("\n    ")}

    ${model.join("\n    ")}
}`;
  };

  // Función para generar entidades intermedias con @ManyToOne (versión original)
  const generateIntermediateEntityCodeOriginal = (cls, associations, projectName) => {
    // Encontrar las clases relacionadas a través de asociaciones
    const relatedAssociations = associations.filter(a => a.associationClass === cls.name);
    const relatedClasses = [];
    
    relatedAssociations.forEach(assoc => {
      relatedClasses.push(assoc.class1);
      relatedClasses.push(assoc.class2);
    });
    
    // Eliminar duplicados
    const uniqueRelatedClasses = [...new Set(relatedClasses)];
    
    // Generar @ManyToOne para cada clase relacionada
    const manyToOneRelations = uniqueRelatedClasses.map(relatedClass => {
      return `@ManyToOne
    @JoinColumn(name = "${relatedClass.toLowerCase()}_id")
    @JsonIgnoreProperties("${cls.name.toLowerCase()}s")
    private ${relatedClass} ${relatedClass.toLowerCase()};`;
    }).join('\n\n    ');

    return `package ${packageName}.model;

import com.fasterxml.jackson.annotation.JsonInclude;
import jakarta.persistence.*;
import lombok.Data;
import java.io.Serializable;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@Entity
@Data
@Table(name = "${cls.name.toLowerCase()}")
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ${cls.name} implements Serializable {
    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE)
    private Long id;
    
    ${cls.attributes.map((attr) => `private String ${attr};`).join('\n    ')}

    ${manyToOneRelations}
}`;
  };

  // Función para generar el código del repositorio
  const generateRepositoryCode = (className) => {
    return `
package ${packageName}.repository;

import ${packageName}.model.${className};
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ${className}Repository extends JpaRepository<${className}, Long> {
}`;
  };

  // Función para generar el código del controlador
  const generateControllerCode = (className, controller) => {
    return `package ${packageName}.controller;

import ${packageName}.dto.${className}DTO;
import ${packageName}.model.${className};
import ${packageName}.service.${className}Service;
${controller.importsAssociation.join("\n  ")}
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Set;
import java.util.Optional;

@RestController
@RequestMapping("/${className.toLowerCase()}")
public class ${className}Controller {
    @Autowired
    private ${className}Service ${className.toLowerCase()}Service;

    @GetMapping
    public List<${className}> getAll() {
        return ${className.toLowerCase()}Service.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<${className}> getById(@PathVariable Long id) {
      Optional<${className}> entity = ${className.toLowerCase()}Service.findById(id);
        return entity.map(ResponseEntity::ok)
        .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<${className}> createOrUpdate(@RequestBody ${className}DTO ${className.toLowerCase()}DTO) {
        ${className} ${className.toLowerCase()} = ${className.toLowerCase()}Service.save(${className.toLowerCase()}DTO);
        return ResponseEntity.ok(${className.toLowerCase()});
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        ${className.toLowerCase()}Service.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    ${controller.functionsAssociation.join("\n  ")}
}`;
  };

  // Función para generar el código del servicio
  const generateServiceCode = (className, service = []) => {
    return `package ${packageName}.service;

import ${packageName}.dto.${className}DTO;
import ${packageName}.model.${className};
import ${packageName}.repository.${className}Repository;
${service.imports.join("\n")}
import jakarta.persistence.EntityNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.HashSet;
import java.util.Set;
import java.util.stream.Collectors;
import java.util.Optional;
@Service
public class ${className}Service {
    @Autowired
    private ${className}Repository ${className.toLowerCase()}Repository;

    ${service.autowired.join("\n \n    ")}
    ${service.setAssociation.join("\n    ")}
    public List<${className}> findAll() {
        return ${className.toLowerCase()}Repository.findAll();
    }

    public Optional<${className}> findById(Long id) {
        ${className} ${className.toLowerCase()} = ${className.toLowerCase()}Repository.findById(id).orElseThrow(() -> new EntityNotFoundException("No se encontró ${className.toLowerCase()} con el id " + id));
        return Optional.of(${className.toLowerCase()});
    }

    public ${className} save(${className}DTO ${className.toLowerCase()}DTO) {
        ${className} ${className.toLowerCase()} = new ${className}();
        ${service.seters.join("\n        ")}
        ${service.setRelationships.join("\n        ")}
        return ${className.toLowerCase()}Repository.save(${className.toLowerCase()});
    }

    public void deleteById(Long id) {
        ${className} ${className.toLowerCase()} = ${className.toLowerCase()}Repository.findById(id).orElseThrow(() -> new EntityNotFoundException("No se encontró ${className.toLowerCase()} con el id " + id));
        ${className.toLowerCase()}Repository.delete(${className.toLowerCase()});
    }
}`;
  };

  // Funcion para generar el codigo de los DTO
  const generateDTOCode = (className, attributes = [], dto = []) => {
    return `package ${packageName}.dto;
import lombok.Data;
@Data
public class ${className}DTO {
  ${attributes.map((attr) => `private String ${attr};`).join("\n  ")}

  ${dto.join("\n  ")}
}`;
  };

  //Genera el archivo de excepciones
  const generateExceptionCode = () => {
    return `package ${packageName}.exception;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;

@ControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(EntityNotFoundException.class)
    public ResponseEntity<String> handleEntityNotFoundException(EntityNotFoundException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ex.getMessage());
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<String> handleGeneralException(Exception ex) {
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("An error occurred: " + ex.getMessage());
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<String> handleIllegalArgumentException(IllegalArgumentException ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(ex.getMessage());
    }

}`;
  };

  // Función para generar el código de las asociaciones intermedias (tablas intermedias)
  const generateAssociationCode = (assoc, dataClass) => {
    const {
      class1,
      class2,
      /* associationClass, */
      class1Multiplicity = "",
      class2Multiplicity = "",
    } = assoc;

    const targetClass = class1 === dataClass.name ? class2 : class1;

    console.log("TargetClass", targetClass);

    console.log("class1", class1);
    console.log("class2", class2);
    console.log("class1Multiplicity", class1Multiplicity);
    console.log("class2Multiplicity", class2Multiplicity);
    console.log("targetClass", targetClass);
    console.log("dataClass", dataClass);
    console.log("foreignKeysAssociations", foreignKeysAssociations);
    console.log("length", foreignKeysAssociations.length);

    if (foreignKeysAssociations.length > 0) {
      dataClass.model.push(`@ManyToMany
    @JoinTable(name = "${dataClass.name.toLowerCase()}_${targetClass.toLowerCase()}",
    joinColumns = @JoinColumn(name = "id_${dataClass.name.toLowerCase()}"),
    inverseJoinColumns = @JoinColumn(name = "id_${targetClass.toLowerCase()}"))
    private Set<${targetClass}> ${targetClass.toLowerCase()}s;\n`);
      foreignKeysAssociations.forEach((fk) => {
        if (fk.class1 === class1 && fk.class2 === class2) {
          if (dataClass.name === fk.classSelector) {
            dataClass.service.imports.push(
              `import ${packageName}.model.${targetClass};
import ${packageName}.repository.${targetClass}Repository;`
            );
            dataClass.service.autowired.push(
              `@Autowired
    private ${targetClass}Repository ${targetClass.toLowerCase()}Repository;`
            );

            dataClass.service.setAssociation.push(
              `public Set<${targetClass}> assign${targetClass}sTo${
                dataClass.name
              } (Long ${dataClass.name.toLowerCase()}Id, Set<Long> ${targetClass.toLowerCase()}Ids) {
        ${
          dataClass.name
        } ${dataClass.name.toLowerCase()} = ${dataClass.name.toLowerCase()}Repository.findById(${dataClass.name.toLowerCase()}Id)
            .orElseThrow(() -> new EntityNotFoundException("${
              dataClass.name
            } con ID " + ${dataClass.name.toLowerCase()}Id + " no encontrado"));

        // Convertimos la lista de ${targetClass.toLowerCase()}s a un Set
        Set<${targetClass}> ${targetClass.toLowerCase()}s = new HashSet<>(${targetClass.toLowerCase()}Repository.findAllById(${targetClass.toLowerCase()}Ids));
        if (${targetClass.toLowerCase()}s.isEmpty()) {
            throw new EntityNotFoundException("No se encontraron ${targetClass.toLowerCase()}s con los IDs proporcionados");
        }

        ${dataClass.name.toLowerCase()}.set${targetClass}s(${targetClass.toLowerCase()}s);
        ${dataClass.name.toLowerCase()}Repository.save(${dataClass.name.toLowerCase()});

        return ${dataClass.name.toLowerCase()}.get${targetClass}s();
    } \n `
            );

            dataClass.controller.importsAssociation.push(
              `import ${packageName}.model.${targetClass};`
            );

            dataClass.controller.functionsAssociation.push(
              `@PostMapping("/{${dataClass.name.toLowerCase()}Id}/${targetClass.toLowerCase()}s")
    public ResponseEntity<Set<${targetClass}>> assign${targetClass}sTo${
                dataClass.name
              }(@PathVariable Long ${dataClass.name.toLowerCase()}Id, @RequestBody Set<Long> ${targetClass.toLowerCase()}Ids) {
        Set<${targetClass}> ${targetClass.toLowerCase()}s = ${dataClass.name.toLowerCase()}Service.assign${targetClass}sTo${
                dataClass.name
              }(${dataClass.name.toLowerCase()}Id, ${targetClass.toLowerCase()}Ids);
        return ResponseEntity.ok(${targetClass.toLowerCase()}s);
    }`
            );
          }
        }
      });
    }
  };

  // Detectar clases intermedias con atributos (función original)
  const isIntermediateWithAttributesOriginal = (className, associations, classes) => {
    const relatedAssociations = associations.filter(a => 
      a.associationClass === className
    );
    const hasAttributes = classes.find(c => c.name === className)?.attributes?.length > 0;
    return relatedAssociations.length === 1 && hasAttributes;
  };

  // Generar archivos de entidades, repositorios, controladores y servicios
  allDataClass.forEach((dataClass) => {
    dataClass = relationships
      .filter((rel) => rel.from === dataClass.name || rel.to === dataClass.name)
      .map((rel) => getDataRelationship(rel, dataClass));
  });

  allDataClass.forEach((dataClass) => {
    // Solo procesar asociaciones si NO es una clase intermedia con atributos
    if (!isIntermediateWithAttributesOriginal(dataClass.name, associations, classes)) {
      dataClass = associations
        .filter(
          (assoc) =>
            assoc.class1 === dataClass.name || assoc.class2 === dataClass.name
        )
        .map((assoc) => generateAssociationCode(assoc, dataClass));
    }
  });

  console.log("allDataClass", allDataClass);

  allDataClass.forEach((cls) => {
    // Verificar si es una clase intermedia con atributos
    const isIntermediateWithAttrs = isIntermediateWithAttributesOriginal(cls.name, associations, classes);
    const isIntermediate = associations.some(
      (assoc) => assoc.associationClass === cls.name
    );

    if (isIntermediateWithAttrs) {
      // Generar entidad intermedia con @ManyToOne
      const entityCode = generateIntermediateEntityCodeOriginal(cls, associations, projectName);
      const repoCode = generateRepositoryCode(cls.name);
      const controllerCode = generateControllerCode(cls.name, cls.controller);
      const serviceCode = generateServiceCode(cls.name, cls.service || []);
      const dtoCode = generateDTOCode(cls.name, cls.attributes, cls.dto || []);
      const exceptionCode = generateExceptionCode();

      // model
      zip.folder("model").file(`${cls.name}.java`, entityCode);
      //repository
      zip.folder("repository").file(`${cls.name}Repository.java`, repoCode);
      //controller
      zip
        .folder("controller")
        .file(`${cls.name}Controller.java`, controllerCode);
      //service
      zip.folder("service").file(`${cls.name}Service.java`, serviceCode);
      //dto
      zip.folder("dto").file(`${cls.name}DTO.java`, dtoCode);
      //exception
      zip
        .folder("exception")
        .file(`GlobalExceptionHandler.java`, exceptionCode);
    } else if (!isIntermediate) {
      // Generar archivos de entidades, repositorios, controladores y servicios solo si no es una clase intermedia
      const entityCode = generateEntityCode(
        cls.name,
        cls.attributes,
        /* associations || [], // Verificación adicional */
        cls.model || []
      );
      const repoCode = generateRepositoryCode(cls.name);
      const controllerCode = generateControllerCode(cls.name, cls.controller);
      const serviceCode = generateServiceCode(cls.name, cls.service || []);
      const dtoCode = generateDTOCode(cls.name, cls.attributes, cls.dto || []);
      const exceptionCode = generateExceptionCode();

      // model
      zip.folder("model").file(`${cls.name}.java`, entityCode);
      //repository
      zip.folder("repository").file(`${cls.name}Repository.java`, repoCode);
      //controller
      zip
        .folder("controller")
        .file(`${cls.name}Controller.java`, controllerCode);
      //service
      zip.folder("service").file(`${cls.name}Service.java`, serviceCode);
      //dto
      zip.folder("dto").file(`${cls.name}DTO.java`, dtoCode);
      //exception
      zip
        .folder("exception")
        .file(`GlobalExceptionHandler.java`, exceptionCode);
    }
  });

  zip.generateAsync({ type: "blob" }).then(function (content) {
    saveAs(content, "spring_boot_project.zip");
  });
};

// NUEVO: Generar proyecto completo de Spring Boot usando Spring Initializr y mezclar el código generado
export const generateAndDownloadSpringBootProject = async (
  classes,
  relationships = [],
  associations = [],
  projectName,
  foreignKeys = {},
  foreignKeysAssociations = {}
) => {
  // Normalización de entradas
  relationships.map((rel) => {
    if (rel.type === "--|>") {
      foreignKeys.push({
        class1: rel.from,
        class2: rel.to,
        foreignKey: rel.from,
      });
    }
  });

  // Generar package name válido para Java
  const sanitizeProjectName = (name) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')  // Solo letras y números
      .replace(/^[0-9]/, 'p$&');  // Si empieza con número, agregar 'p'
  };
  
  const basePackageName = sanitizeProjectName(projectName);
  const packageName = `com.ejemplo.${basePackageName}`;
  const artifactId = basePackageName;
  const name = projectName;

  const params = new URLSearchParams({
    type: "maven-project",
    language: "java",
    packaging: "jar",
    javaVersion: "17",
    groupId: packageName,
    artifactId,
    name,
    packageName,
    description: `Proyecto generado desde diagrama (${name})`,
    dependencies: "web,data-jpa,postgresql,lombok",
    mavenWrapper: "true"
  });

  const initializrUrl = `https://start.spring.io/starter.zip?${params.toString()}`;

  // Descargar proyecto base desde Spring Initializr (con fallback local por CORS)
  let baseZip;
  try {
    console.log("🔄 Intentando descargar desde Spring Initializr:", initializrUrl);
    const response = await fetch(initializrUrl, { method: "GET" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const baseArrayBuffer = await response.arrayBuffer();
    baseZip = await JSZip.loadAsync(baseArrayBuffer);
    console.log("✅ Spring Initializr funcionó correctamente");
  } catch (err) {
    console.warn("❌ Spring Initializr falló por CORS/Error:", err.message);
    console.log("🔄 Usando fallback local para generar proyecto base...");
    // Fallback: construir un proyecto Spring Boot mínimo localmente (evita CORS)
    baseZip = new JSZip();

    // Estructura estándar Maven
    const basePath = "";
    const srcMainJava = `${basePath}src/main/java/${packageName.replace(/\\./g, "/")}`;
    const srcMainResources = `${basePath}src/main/resources`;
    const srcTestJava = `${basePath}src/test/java/${packageName.replace(/\\./g, "/")}`;
    // Derivar un nombre de clase válido: tomar el último segmento y convertir a PascalCase
    const toPascal = (str) => str
      .split(/[\W_\.]+/)
      .filter(Boolean)
      .map(s => s.charAt(0).toUpperCase() + s.slice(1))
      .join("");
    const lastSegment = (name.includes(".")) ? name.split(".").pop() : name;
    const appClassName = `${toPascal(lastSegment)}Application`;

    // pom.xml básico con Spring Boot 3.x y Java 17
    const pom = `<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/xsd/maven-4.0.0.xsd">
  <modelVersion>4.0.0</modelVersion>
  <groupId>${packageName}</groupId>
  <artifactId>${artifactId}</artifactId>
  <version>0.0.1-SNAPSHOT</version>
  <name>${name}</name>
  <description>Proyecto generado desde diagrama (${name})</description>
  <properties>
    <java.version>17</java.version>
    <maven.compiler.source>17</maven.compiler.source>
    <maven.compiler.target>17</maven.compiler.target>
    <lombok.version>1.18.32</lombok.version>
  </properties>
  <parent>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-parent</artifactId>
    <version>3.2.5</version>
    <relativePath/>
  </parent>
  <dependencies>
    <dependency>
      <groupId>org.springframework.boot</groupId>
      <artifactId>spring-boot-starter-web</artifactId>
    </dependency>
    <dependency>
      <groupId>org.springframework.boot</groupId>
      <artifactId>spring-boot-starter-data-jpa</artifactId>
    </dependency>
    <dependency>
      <groupId>org.postgresql</groupId>
      <artifactId>postgresql</artifactId>
      <scope>runtime</scope>
    </dependency>
    <dependency>
      <groupId>org.projectlombok</groupId>
      <artifactId>lombok</artifactId>
      <version>${"${lombok.version}"}</version>
      <scope>compile</scope>
    </dependency>
    <!-- Swagger/OpenAPI Documentation -->
    <dependency>
      <groupId>org.springdoc</groupId>
      <artifactId>springdoc-openapi-starter-webmvc-ui</artifactId>
      <version>2.5.0</version>
    </dependency>
    <dependency>
      <groupId>org.springframework.boot</groupId>
      <artifactId>spring-boot-starter-test</artifactId>
      <scope>test</scope>
    </dependency>
  </dependencies>
  <build>
    <plugins>
      <plugin>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-maven-plugin</artifactId>
        <configuration>
          <excludes>
            <exclude>
              <groupId>org.projectlombok</groupId>
              <artifactId>lombok</artifactId>
            </exclude>
          </excludes>
        </configuration>
      </plugin>
      <plugin>
        <groupId>org.apache.maven.plugins</groupId>
        <artifactId>maven-compiler-plugin</artifactId>
        <version>3.11.0</version>
        <configuration>
          <source>17</source>
          <target>17</target>
          <annotationProcessorPaths>
            <path>
              <groupId>org.projectlombok</groupId>
              <artifactId>lombok</artifactId>
              <version>${"${lombok.version}"}</version>
            </path>
          </annotationProcessorPaths>
        </configuration>
      </plugin>
    </plugins>
  </build>
</project>`;

    // Clase principal
    const appClass = `package ${packageName};

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class ${appClassName} {
    public static void main(String[] args) {
        SpringApplication.run(${appClassName}.class, args);
    }
}`;

    // Archivos
    console.log("📁 Creando archivo base: pom.xml");
    baseZip.file("pom.xml", pom);
    console.log("📁 Creando archivo base:", `${srcMainJava}/${appClassName}.java`);
    baseZip.file(`${srcMainJava}/${appClassName}.java`, appClass);
    console.log("📁 Creando archivo base:", `${srcMainResources}/application.properties`);
    baseZip.file(`${srcMainResources}/application.properties`, "");
    console.log("📁 Creando archivo base:", `${srcTestJava}/${appClassName}Tests.java`);
    baseZip.file(`${srcTestJava}/${appClassName}Tests.java`, `package ${packageName};\n\nimport org.junit.jupiter.api.Test;\nimport org.springframework.boot.test.context.SpringBootTest;\n\n@SpringBootTest\nclass ${appClassName}Tests {\n    @Test\n    void contextLoads() {}\n}`);

    // Maven Wrapper - Archivos para ejecutar sin Maven instalado
    const mvnwContent = `#!/bin/sh
# Maven Wrapper Script
# This script allows running Maven without having it installed globally

# Check if JAVA_HOME is set
if [ -z "$JAVA_HOME" ]; then
    echo "Error: JAVA_HOME is not set. Please set JAVA_HOME to your JDK installation directory."
    exit 1
fi

# Set Maven wrapper properties
WRAPPER_JAR=".mvn/wrapper/maven-wrapper.jar"
WRAPPER_LAUNCHER="org.apache.maven.wrapper.MavenWrapperMain"

# Download Maven wrapper if it doesn't exist
if [ ! -f "$WRAPPER_JAR" ]; then
    echo "Downloading Maven wrapper..."
    mkdir -p .mvn/wrapper
    curl -o "$WRAPPER_JAR" "https://repo.maven.apache.org/maven2/org/apache/maven/wrapper/maven-wrapper/3.1.0/maven-wrapper-3.1.0.jar"
fi

# Execute Maven with wrapper
exec "$JAVA_HOME/bin/java" \\
    -classpath "$WRAPPER_JAR" \\
    "-Dmaven.multiModuleProjectDirectory=$(pwd)" \\
    "$WRAPPER_LAUNCHER" "$@"`;

    const mvnwCmdContent = `@echo off
REM Maven Wrapper Script for Windows
REM This script allows running Maven without having it installed globally

REM Check if JAVA_HOME is set
if "%JAVA_HOME%"=="" (
    echo Error: JAVA_HOME is not set. Please set JAVA_HOME to your JDK installation directory.
    exit /b 1
)

REM Set Maven wrapper properties
set WRAPPER_JAR=.mvn\\wrapper\\maven-wrapper.jar
set WRAPPER_LAUNCHER=org.apache.maven.wrapper.MavenWrapperMain

REM Download Maven wrapper if it doesn't exist
if not exist "%WRAPPER_JAR%" (
    echo Downloading Maven wrapper...
    if not exist ".mvn\\wrapper" mkdir .mvn\\wrapper
    powershell -Command "Invoke-WebRequest -Uri 'https://repo.maven.apache.org/maven2/org/apache/maven/wrapper/maven-wrapper/3.1.0/maven-wrapper-3.1.0.jar' -OutFile '%WRAPPER_JAR%'"
)

REM Execute Maven with wrapper
"%JAVA_HOME%\\bin\\java.exe" -classpath "%WRAPPER_JAR%" "-Dmaven.multiModuleProjectDirectory=%CD%" "%WRAPPER_LAUNCHER%" %*`;

    const mavenWrapperProperties = `# Licensed to the Apache Software Foundation (ASF) under one
# or more contributor license agreements.  See the NOTICE file
# distributed with this work for additional information
# regarding copyright ownership.  The ASF licenses this file
# to you under the Apache License, Version 2.0 (the
# "License"); you may not use this file except in compliance
# with the License.  You may obtain a copy of the License at
#
#   https://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing,
# software distributed under the License is distributed on an
# "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
# KIND, either express or implied.  See the License for the
# specific language governing permissions and limitations
# under the License.
distributionUrl=https://repo.maven.apache.org/maven2/org/apache/maven/apache-maven/3.9.6/apache-maven-3.9.6-bin.zip
wrapperUrl=https://repo.maven.apache.org/maven2/org/apache/maven/wrapper/maven-wrapper/3.1.0/maven-wrapper-3.1.0.jar`;

    const jvmConfig = `# This file was generated by the Gradle 'init' task.
# https://docs.gradle.org/current/userguide/build_init_plugin.html
# The following settings were chosen to run a simple application with a non-modular main class.
# For more details on the 'init' task, see https://docs.gradle.org/current/userguide/build_init_plugin.html#sec:build_init_types
# For more details on '--args', see https://docs.gradle.org/current/userguide/application_plugin.html#sec:application_plugin
--add-opens
jdk.compiler/com.sun.tools.javac.code=ALL-UNNAMED
--add-opens
jdk.compiler/com.sun.tools.javac.comp=ALL-UNNAMED
--add-opens
jdk.compiler/com.sun.tools.javac.file=ALL-UNNAMED
--add-opens
jdk.compiler/com.sun.tools.javac.main=ALL-UNNAMED
--add-opens
jdk.compiler/com.sun.tools.javac.jvm=ALL-UNNAMED
--add-opens
jdk.compiler/com.sun.tools.javac.parser=ALL-UNNAMED
--add-opens
jdk.compiler/com.sun.tools.javac.processing=ALL-UNNAMED
--add-opens
jdk.compiler/com.sun.tools.javac.tree=ALL-UNNAMED
--add-opens
jdk.compiler/com.sun.tools.javac.util=ALL-UNNAMED
--add-opens
jdk.compiler/com.sun.tools.javac.jvm=ALL-UNNAMED`;

    // Agregar archivos del Maven Wrapper
    baseZip.file("mvnw", mvnwContent);
    baseZip.file("mvnw.cmd", mvnwCmdContent);
    baseZip.file(".mvn/wrapper/maven-wrapper.properties", mavenWrapperProperties);
    baseZip.file(".mvn/jvm.config", jvmConfig);

    // README con instrucciones de uso
    console.log("📁 Creando README.md, mvnw, y archivos wrapper...");
    const readmeContent = `# ${name}

Proyecto Spring Boot generado automáticamente desde un diagrama de clases.

## Requisitos

- Java 17 o superior
- PostgreSQL (opcional, para base de datos)

## Configuración

1. **Base de datos (PostgreSQL)**:
   - Instala PostgreSQL si no lo tienes
   - Crea una base de datos llamada \`${artifactId}\`
   - Usuario: \`postgres\`
   - Contraseña: \`postgres\`
   - Puerto: \`5432\`

2. **Configuración de la base de datos**:
   - Edita el archivo \`src/main/resources/application.properties\` si necesitas cambiar la configuración de la base de datos

## Ejecución

### Opción 1: Usando Maven Wrapper (Recomendado)
No necesitas tener Maven instalado globalmente.

**En Windows:**
\`\`\`bash
./mvnw.cmd spring-boot:run
\`\`\`

**En Linux/Mac:**
\`\`\`bash
./mvnw spring-boot:run
\`\`\`

### Opción 2: Usando Maven (si lo tienes instalado)
\`\`\`bash
mvn spring-boot:run
\`\`\`

## Compilación

### Usando Maven Wrapper:
**En Windows:**
\`\`\`bash
./mvnw.cmd clean package
\`\`\`

**En Linux/Mac:**
\`\`\`bash
./mvnw clean package
\`\`\`

### Usando Maven:
\`\`\`bash
mvn clean package
\`\`\`

## Estructura del Proyecto

- \`src/main/java/${packageName.replace(/\./g, "/")}/\`: Código fuente Java
  - \`model/\`: Entidades JPA
  - \`repository/\`: Repositorios de datos
  - \`service/\`: Lógica de negocio
  - \`controller/\`: Controladores REST
  - \`dto/\`: Objetos de transferencia de datos
  - \`exception/\`: Manejo de excepciones
- \`src/main/resources/\`: Recursos de la aplicación
- \`src/test/java/\`: Pruebas unitarias

## API Endpoints

El proyecto incluye endpoints REST para cada entidad:
- \`GET /{entidad}\`: Obtener todas las entidades
- \`GET /{entidad}/{id}\`: Obtener entidad por ID
- \`POST /{entidad}\`: Crear/actualizar entidad
- \`DELETE /{entidad}/{id}\`: Eliminar entidad

## Documentación API (Swagger)

Una vez que el proyecto esté ejecutándose, puedes acceder a la documentación interactiva de la API en:
- **Swagger UI**: http://localhost:8080/swagger-ui.html
- **API Docs (JSON)**: http://localhost:8080/v3/api-docs
- **OpenAPI Spec**: http://localhost:8080/v3/api-docs.yaml

Swagger te permite:
- Ver todos los endpoints disponibles
- Probar las APIs directamente desde el navegador
- Ver esquemas de datos y ejemplos
- Generar clientes para diferentes lenguajes

## Configuración CORS

El proyecto incluye configuración CORS automática que permite:
- Peticiones desde cualquier origen (configurado para desarrollo)
- Métodos HTTP: GET, POST, PUT, DELETE, OPTIONS
- Todos los headers permitidos
- Sin credenciales por defecto (cambiable en \`CorsConfig.java\`)

**Para producción**, modifica el archivo \`src/main/java/${packageName.replace(/\./g, "/")}/config/CorsConfig.java\` para restringir los orígenes permitidos.

## Notas

- El proyecto usa Lombok para reducir código boilerplate
- Las entidades están configuradas para PostgreSQL
- El proyecto incluye manejo de excepciones global
- Todas las relaciones JPA están configuradas automáticamente
- **Configuración CORS incluida**: El proyecto incluye configuración CORS para permitir peticiones desde el frontend
- **Maven Wrapper incluido**: No necesitas tener Maven instalado globalmente para ejecutar el proyecto

## Solución de Problemas

1. **Error de conexión a la base de datos**: Verifica que PostgreSQL esté ejecutándose y que la configuración en \`application.properties\` sea correcta.

2. **Error de Java**: Asegúrate de tener Java 17 o superior instalado y configurado correctamente.

3. **Error de permisos en mvnw**: En Linux/Mac, ejecuta:
   \`\`\`bash
   chmod +x mvnw
   \`\`\`
`;

    baseZip.file("README.md", readmeContent);
  }

  // Helper para asegurar directorios dentro del zip
  const ensureDir = (zip, path) => {
    const parts = path.split("/");
    let currentPath = "";
    parts.forEach((part) => {
      if (!part) return;
      currentPath += `/${part}`;
      if (!zip.folder(currentPath.replace(/^\//, ""))) {
        zip.folder(currentPath.replace(/^\//, ""));
      }
    });
  };

  // Construir datos de clases y relaciones (reutiliza la misma lógica que la exportación de carpetas)
  const allDataClass = classes.map((cls) => {
    return {
      name: cls.name,
      attributes: cls.attributes,
      model: [],
      dto: [],
      service: {
        imports: [],
        autowired: [],
        seters: cls.attributes.map((attr) => {
          return `${cls.name.toLowerCase()}.set${attr.charAt(0).toUpperCase() + attr.slice(1)}(${cls.name.toLowerCase()}DTO.get${attr.charAt(0).toUpperCase() + attr.slice(1)}());`;
        }),
        setAssociation: [],
        setRelationships: [],
      },
      controller: {
        importsAssociation: [],
        functionsAssociation: [],
      },
    };
  });

  const getDataRelationship = (rel, dataClass) => {
    if (!rel || !rel.from || !rel.to || !rel.type) return "";
    const { from, to, class1Multiplicity = "", class2Multiplicity = "" } = rel;
    const targetClass = from === dataClass.name ? to : from;
    const includeForeignKey = foreignKeys.some(
      (fk) => fk.class1 === from && fk.class2 === to && fk.foreignKey === dataClass.name
    );

    if (
      (class1Multiplicity === "*" || class1Multiplicity === "0..*" || class1Multiplicity === "1..*") &&
      class2Multiplicity === "1"
    ) {
      if (dataClass.name === to) {
        dataClass.model.push(`@ManyToOne
    @JoinColumn(name = "${to.toLowerCase()}_id")
    @JsonIgnoreProperties("${from.toLowerCase()}s")
    private ${to} ${to.toLowerCase()}; \n `);
        dataClass.dto.push(`private Long ${to.toLowerCase()}Id; \n  `);
        dataClass.service.imports.push(
          `import ${packageName}.model.${to};\nimport ${packageName}.repository.${to}Repository;\n          `
        );
        dataClass.service.autowired.push(
          `@Autowired
    private ${to}Repository ${to.toLowerCase()}Repository;`
        );
        dataClass.service.setRelationships.push(
          `${to} ${to.toLowerCase()} = ${to.toLowerCase()}Repository.findById(${dataClass.name.toLowerCase()}DTO.get${to}Id()).orElseThrow(() -> new IllegalArgumentException("No se encontró ${dataClass.name.toLowerCase()} con el id " + ${dataClass.name.toLowerCase()}DTO.get${to}Id()));
        ${dataClass.name.toLowerCase()}.set${to}(${to.toLowerCase()});`
        );
      } else {
        dataClass.model.push(`@OneToMany(mappedBy = "${to.toLowerCase()}", fetch = FetchType.LAZY, cascade = CascadeType.ALL)
    @JsonIgnoreProperties("${to.toLowerCase()}s")
    private List<${from}> ${from.toLowerCase()}s; \n  `);
      }
    } else if (
      class1Multiplicity === "1" &&
      (class2Multiplicity === "*" || class2Multiplicity === "0..*" || class2Multiplicity === "1..*")
    ) {
      if (dataClass.name === from) {
        dataClass.model.push(`@OneToMany(mappedBy = "${from.toLowerCase()}", fetch = FetchType.LAZY, cascade = CascadeType.ALL)
    @JsonIgnoreProperties("${from.toLowerCase()}s")
    private List<${to}> ${to.toLowerCase()}s; \n  `);
      } else {
        dataClass.model.push(`@ManyToOne
    @JoinColumn(name = "${from.toLowerCase()}_id")
    @JsonIgnoreProperties("${to.toLowerCase()}s")
    private ${from} ${from.toLowerCase()}; \n `);
        dataClass.dto.push(`private Long ${from.toLowerCase()}Id; \n  `);
        dataClass.service.imports.push(
          `import ${packageName}.model.${from};\nimport ${packageName}.repository.${from}Repository;\n          `
        );
        dataClass.service.autowired.push(
          `@Autowired
    private ${from}Repository ${from.toLowerCase()}Repository;`
        );
        dataClass.service.setRelationships.push(
          `${from} ${from.toLowerCase()} = ${from.toLowerCase()}Repository.findById(${dataClass.name.toLowerCase()}DTO.get${from}Id()).orElseThrow(() -> new IllegalArgumentException("No se encontró ${dataClass.name.toLowerCase()} con el id " + ${dataClass.name.toLowerCase()}DTO.get${from}Id()));
        ${dataClass.name.toLowerCase()}.set${from}(${from.toLowerCase()});`
        );
      }
    } else if (class1Multiplicity === "1" && class2Multiplicity === "1" && includeForeignKey) {
      dataClass.model.push(`@OneToOne
    @JoinColumn(name = "${targetClass.toLowerCase()}_id")
    private ${targetClass} ${targetClass.toLowerCase()}; \n `);
      dataClass.dto.push(`private Long ${targetClass.toLowerCase()}Id; \n `);
      dataClass.service.imports.push(
        `import ${packageName}.model.${targetClass};\nimport ${packageName}.repository.${targetClass}Repository;\n        `
      );
      dataClass.service.autowired.push(
        `@Autowired
    private ${targetClass}Repository ${targetClass.toLowerCase()}Repository;`
      );
      dataClass.service.setRelationships.push(
        `${targetClass} ${targetClass.toLowerCase()} = ${targetClass.toLowerCase()}Repository.findById(${dataClass.name.toLowerCase()}DTO.get${targetClass}Id()).orElseThrow(() -> new IllegalArgumentException("No se encontró ${dataClass.name.toLowerCase()} con el id " + ${dataClass.name.toLowerCase()}DTO.get${targetClass}Id()));
        ${dataClass.name.toLowerCase()}.set${targetClass}(${targetClass.toLowerCase()});`
      );
    } else {
      dataClass.model.push(`@OneToOne
    @JoinColumn(name = "${targetClass.toLowerCase()}_id")
    private ${targetClass} ${targetClass.toLowerCase()}; \n `);
    }
  };

  const generateEntityCode = (className, attributes = [], model = []) => {
    return `package ${packageName}.model;

import com.fasterxml.jackson.annotation.JsonInclude;
import jakarta.persistence.*;
import lombok.Data;
import java.io.Serializable;
import java.util.List;
import java.util.Set;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@Entity
@Data
@Table(name = "${className.toLowerCase() === "user" ? "users" : className.toLowerCase()}")
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ${className} implements Serializable {
    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE)
    private Long id;
    ${attributes.map((attr) => `private String ${attr};`).join("\n    ")}

    ${model.join("\n    ")}
}`;
  };

  const generateRepositoryCode = (className) => {
    return `
package ${packageName}.repository;

import ${packageName}.model.${className};
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ${className}Repository extends JpaRepository<${className}, Long> {
}`;
  };

  const generateControllerCode = (className, controller) => {
    return `package ${packageName}.controller;

import ${packageName}.dto.${className}DTO;
import ${packageName}.model.${className};
import ${packageName}.service.${className}Service;
${controller.importsAssociation.join("\n  ")}
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;

import java.util.List;
import java.util.Set;
import java.util.Optional;

@RestController
@RequestMapping("/${className.toLowerCase()}")
@Tag(name = "${className}", description = "API para gestionar ${className}")
public class ${className}Controller {
    @Autowired
    private ${className}Service ${className.toLowerCase()}Service;

    @GetMapping
    @Operation(summary = "Obtener todos los ${className}", description = "Retorna una lista de todos los ${className}")
    @ApiResponse(responseCode = "200", description = "Lista obtenida exitosamente")
    public List<${className}> getAll() {
        return ${className.toLowerCase()}Service.findAll();
    }

    @GetMapping("/{id}")
    @Operation(summary = "Obtener ${className} por ID", description = "Retorna un ${className} específico por su ID")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "${className} encontrado"),
        @ApiResponse(responseCode = "404", description = "${className} no encontrado")
    })
    public ResponseEntity<${className}> getById(
        @Parameter(description = "ID del ${className}", required = true) 
        @PathVariable Long id) {
      Optional<${className}> entity = ${className.toLowerCase()}Service.findById(id);
        return entity.map(ResponseEntity::ok)
        .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PostMapping
    @Operation(summary = "Crear o actualizar ${className}", description = "Crea un nuevo ${className} o actualiza uno existente")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "${className} creado/actualizado exitosamente"),
        @ApiResponse(responseCode = "400", description = "Datos inválidos")
    })
    public ResponseEntity<${className}> createOrUpdate(
        @Parameter(description = "Datos del ${className}", required = true)
        @RequestBody ${className}DTO ${className.toLowerCase()}DTO) {
        ${className} ${className.toLowerCase()} = ${className.toLowerCase()}Service.save(${className.toLowerCase()}DTO);
        return ResponseEntity.ok(${className.toLowerCase()});
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Eliminar ${className}", description = "Elimina un ${className} por su ID")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "204", description = "${className} eliminado exitosamente"),
        @ApiResponse(responseCode = "404", description = "${className} no encontrado")
    })
    public ResponseEntity<Void> delete(
        @Parameter(description = "ID del ${className} a eliminar", required = true)
        @PathVariable Long id) {
        ${className.toLowerCase()}Service.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    ${controller.functionsAssociation.join("\n  ")}
}`;
  };

  const generateServiceCode = (className, service = []) => {
    return `package ${packageName}.service;

import ${packageName}.dto.${className}DTO;
import ${packageName}.model.${className};
import ${packageName}.repository.${className}Repository;
${service.imports.join("\n")}
import jakarta.persistence.EntityNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.HashSet;
import java.util.Set;
import java.util.stream.Collectors;
import java.util.Optional;
@Service
public class ${className}Service {
    @Autowired
    private ${className}Repository ${className.toLowerCase()}Repository;

    ${service.autowired.join("\n \n    ")}
    ${service.setAssociation.join("\n    ")}
    public List<${className}> findAll() {
        return ${className.toLowerCase()}Repository.findAll();
    }

    public Optional<${className}> findById(Long id) {
        ${className} ${className.toLowerCase()} = ${className.toLowerCase()}Repository.findById(id).orElseThrow(() -> new EntityNotFoundException("No se encontró ${className.toLowerCase()} con el id " + id));
        return Optional.of(${className.toLowerCase()});
    }

    public ${className} save(${className}DTO ${className.toLowerCase()}DTO) {
        ${className} ${className.toLowerCase()} = new ${className}();
        ${service.seters.join("\n        ")}
        ${service.setRelationships.join("\n        ")}
        return ${className.toLowerCase()}Repository.save(${className.toLowerCase()});
    }

    public void deleteById(Long id) {
        ${className} ${className.toLowerCase()} = ${className.toLowerCase()}Repository.findById(id).orElseThrow(() -> new EntityNotFoundException("No se encontró ${className.toLowerCase()} con el id " + id));
        ${className.toLowerCase()}Repository.delete(${className.toLowerCase()});
    }
}`;
  };

  const generateDTOCode = (className, attributes = [], dto = []) => {
    return `package ${packageName}.dto;
import lombok.Data;
@Data
public class ${className}DTO {
  ${attributes.map((attr) => `private String ${attr};`).join("\n  ")}

  ${dto.join("\n  ")}
}`;
  };

  const generateExceptionCode = () => {
    return `package ${packageName}.exception;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;

@ControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(EntityNotFoundException.class)
    public ResponseEntity<String> handleEntityNotFoundException(EntityNotFoundException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ex.getMessage());
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<String> handleGeneralException(Exception ex) {
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("An error occurred: " + ex.getMessage());
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<String> handleIllegalArgumentException(IllegalArgumentException ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(ex.getMessage());
    }

}`;
  };

  // Función para generar la configuración de CORS
  const generateCorsConfigCode = () => {
    return `package ${packageName}.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.util.Arrays;

@Configuration
public class CorsConfig implements WebMvcConfigurer {

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/**")
                .allowedOrigins("*") // Permite todas las orígenes - cambiar en producción
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                .allowedHeaders("*")
                .allowCredentials(false); // Cambiar a true si necesitas enviar cookies
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOriginPatterns(Arrays.asList("*")); // Permite todas las orígenes
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(Arrays.asList("*"));
        configuration.setAllowCredentials(false);
        
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}`;
  };

  // Función para generar entidades intermedias con @ManyToOne
  const generateIntermediateEntityCode = (cls, associations, packageName) => {
    // Encontrar las clases relacionadas a través de asociaciones
    const relatedAssociations = associations.filter(a => a.associationClass === cls.name);
    const relatedClasses = [];
    
    relatedAssociations.forEach(assoc => {
      relatedClasses.push(assoc.class1);
      relatedClasses.push(assoc.class2);
    });
    
    // Eliminar duplicados
    const uniqueRelatedClasses = [...new Set(relatedClasses)];
    
    // Generar @ManyToOne para cada clase relacionada
    const manyToOneRelations = uniqueRelatedClasses.map(relatedClass => {
      return `@ManyToOne
    @JoinColumn(name = "${relatedClass.toLowerCase()}_id")
    @JsonIgnoreProperties("${cls.name.toLowerCase()}s")
    private ${relatedClass} ${relatedClass.toLowerCase()};`;
    }).join('\n\n    ');

    return `package ${packageName}.model;

import com.fasterxml.jackson.annotation.JsonInclude;
import jakarta.persistence.*;
import lombok.Data;
import java.io.Serializable;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@Entity
@Data
@Table(name = "${cls.name.toLowerCase()}")
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ${cls.name} implements Serializable {
    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE)
    private Long id;
    
    ${cls.attributes.map((attr) => `private String ${attr};`).join('\n    ')}

    ${manyToOneRelations}
}`;
  };

  const generateAssociationCode = (assoc, dataClass) => {
    const { class1, class2, class1Multiplicity = "", class2Multiplicity = "" } = assoc;
    const targetClass = class1 === dataClass.name ? class2 : class1;
    if ((foreignKeysAssociations && foreignKeysAssociations.length > 0)) {
      dataClass.model.push(`@ManyToMany
    @JoinTable(name = "${dataClass.name.toLowerCase()}_${targetClass.toLowerCase()}",
    joinColumns = @JoinColumn(name = "id_${dataClass.name.toLowerCase()}"),
    inverseJoinColumns = @JoinColumn(name = "id_${targetClass.toLowerCase()}") )
    private Set<${targetClass}> ${targetClass.toLowerCase()}s;\n`);
      foreignKeysAssociations.forEach((fk) => {
        if (fk.class1 === class1 && fk.class2 === class2) {
          if (dataClass.name === fk.classSelector) {
            dataClass.service.imports.push(
              `import ${packageName}.model.${targetClass};\nimport ${packageName}.repository.${targetClass}Repository;`
            );
            dataClass.service.autowired.push(
              `@Autowired
    private ${targetClass}Repository ${targetClass.toLowerCase()}Repository;`
            );
            dataClass.service.setAssociation.push(
              `public Set<${targetClass}> assign${targetClass}sTo${dataClass.name} (Long ${dataClass.name.toLowerCase()}Id, Set<Long> ${targetClass.toLowerCase()}Ids) {
        ${dataClass.name} ${dataClass.name.toLowerCase()} = ${dataClass.name.toLowerCase()}Repository.findById(${dataClass.name.toLowerCase()}Id)
            .orElseThrow(() -> new EntityNotFoundException("${dataClass.name} con ID " + ${dataClass.name.toLowerCase()}Id + " no encontrado"));

        // Convertimos la lista de ${targetClass.toLowerCase()}s a un Set
        Set<${targetClass}> ${targetClass.toLowerCase()}s = new HashSet<>(${targetClass.toLowerCase()}Repository.findAllById(${targetClass.toLowerCase()}Ids));
        if (${targetClass.toLowerCase()}s.isEmpty()) {
            throw new EntityNotFoundException("No se encontraron ${targetClass.toLowerCase()}s con los IDs proporcionados");
        }

        ${dataClass.name.toLowerCase()}.set${targetClass}s(${targetClass.toLowerCase()}s);
        ${dataClass.name.toLowerCase()}Repository.save(${dataClass.name.toLowerCase()});

        return ${dataClass.name.toLowerCase()}.get${targetClass}s();
    } \n `
            );
            dataClass.controller.importsAssociation.push(
              `import ${packageName}.model.${targetClass};`
            );
            dataClass.controller.functionsAssociation.push(
              `@PostMapping("/{${dataClass.name.toLowerCase()}Id}/${targetClass.toLowerCase()}s")
    public ResponseEntity<Set<${targetClass}>> assign${targetClass}sTo${dataClass.name}(@PathVariable Long ${dataClass.name.toLowerCase()}Id, @RequestBody Set<Long> ${targetClass.toLowerCase()}Ids) {
        Set<${targetClass}> ${targetClass.toLowerCase()}s = ${dataClass.name.toLowerCase()}Service.assign${targetClass}sTo${dataClass.name}(${dataClass.name.toLowerCase()}Id, ${targetClass.toLowerCase()}Ids);
        return ResponseEntity.ok(${targetClass.toLowerCase()}s);
    }`
            );
          }
        }
      });
    }
  };

  // Detectar clases intermedias con atributos
  const isIntermediateWithAttributes = (className, associations, classes) => {
    const relatedAssociations = associations.filter(a => 
      a.associationClass === className
    );
    const hasAttributes = classes.find(c => c.name === className)?.attributes?.length > 0;
    return relatedAssociations.length === 1 && hasAttributes;
  };

  // Procesar relaciones y asociaciones
  allDataClass.forEach((dataClass) => {
    relationships
      .filter((rel) => rel.from === dataClass.name || rel.to === dataClass.name)
      .forEach((rel) => getDataRelationship(rel, dataClass));
  });

  allDataClass.forEach((dataClass) => {
    // Solo procesar asociaciones si NO es una clase intermedia con atributos
    if (!isIntermediateWithAttributes(dataClass.name, associations, classes)) {
      associations
        .filter((assoc) => assoc.class1 === dataClass.name || assoc.class2 === dataClass.name)
        .forEach((assoc) => generateAssociationCode(assoc, dataClass));
    }
  });

  // Escribir archivos en el zip base
  const basePackagePath = `src/main/java/${packageName.replace(/\./g, "/")}`;
  const modelDir = `${basePackagePath}/model`;
  const repoDir = `${basePackagePath}/repository`;
  const controllerDir = `${basePackagePath}/controller`;
  const serviceDir = `${basePackagePath}/service`;
  const dtoDir = `${basePackagePath}/dto`;
  const exceptionDir = `${basePackagePath}/exception`;
  const configDir = `${basePackagePath}/config`;

  [modelDir, repoDir, controllerDir, serviceDir, dtoDir, exceptionDir, configDir].forEach((dir) => ensureDir(baseZip, dir));

  allDataClass.forEach((cls) => {
    // Verificar si es una clase intermedia con atributos
    const isIntermediate = isIntermediateWithAttributes(cls.name, associations, classes);
    
    if (isIntermediate) {
      // Generar entidad intermedia con @ManyToOne
      const intermediateEntityCode = generateIntermediateEntityCode(cls, associations, packageName);
      const repoCode = generateRepositoryCode(cls.name);
      const controllerCode = generateControllerCode(cls.name, cls.controller);
      const serviceCode = generateServiceCode(cls.name, cls.service || []);
      const dtoCode = generateDTOCode(cls.name, cls.attributes, cls.dto || []);
      const exceptionCode = generateExceptionCode();

      baseZip.file(`${modelDir}/${cls.name}.java`, intermediateEntityCode);
      baseZip.file(`${repoDir}/${cls.name}Repository.java`, repoCode);
      baseZip.file(`${controllerDir}/${cls.name}Controller.java`, controllerCode);
      baseZip.file(`${serviceDir}/${cls.name}Service.java`, serviceCode);
      baseZip.file(`${dtoDir}/${cls.name}DTO.java`, dtoCode);
      baseZip.file(`${exceptionDir}/GlobalExceptionHandler.java`, exceptionCode);
    } else {
      // Generar entidad normal
      const entityCode = generateEntityCode(cls.name, cls.attributes, cls.model || []);
      const repoCode = generateRepositoryCode(cls.name);
      const controllerCode = generateControllerCode(cls.name, cls.controller);
      const serviceCode = generateServiceCode(cls.name, cls.service || []);
      const dtoCode = generateDTOCode(cls.name, cls.attributes, cls.dto || []);
      const exceptionCode = generateExceptionCode();

      baseZip.file(`${modelDir}/${cls.name}.java`, entityCode);
      baseZip.file(`${repoDir}/${cls.name}Repository.java`, repoCode);
      baseZip.file(`${controllerDir}/${cls.name}Controller.java`, controllerCode);
      baseZip.file(`${serviceDir}/${cls.name}Service.java`, serviceCode);
      baseZip.file(`${dtoDir}/${cls.name}DTO.java`, dtoCode);
      baseZip.file(`${exceptionDir}/GlobalExceptionHandler.java`, exceptionCode);
    }
  });

  // Generar archivo de configuración CORS
  const corsConfigCode = generateCorsConfigCode();
  baseZip.file(`${configDir}/CorsConfig.java`, corsConfigCode);

  // Añadir configuración básica de PostgreSQL
  const propertiesPath = "src/main/resources/application.properties";
  const dbProps = `# Database Configuration
spring.datasource.url=jdbc:postgresql://localhost:5432/${artifactId}
spring.datasource.username=postgres
spring.datasource.password=postgres

# JPA Configuration
spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=true
spring.jpa.properties.hibernate.format_sql=true
spring.jpa.database-platform=org.hibernate.dialect.PostgreSQLDialect

# Swagger/OpenAPI Configuration
springdoc.api-docs.path=/v3/api-docs
springdoc.swagger-ui.path=/swagger-ui.html
springdoc.swagger-ui.operationsSorter=method
springdoc.swagger-ui.tagsSorter=alpha
springdoc.swagger-ui.disable-swagger-default-url=true

# Application Configuration
server.port=8080
logging.level.org.springframework.web=DEBUG`;
  console.log("📁 Actualizando application.properties con configuración de base de datos");
  baseZip.file(propertiesPath, dbProps);

  console.log("📦 Generando ZIP final:", `${artifactId}.zip`);
  console.log("📂 Archivos en el ZIP:", Object.keys(baseZip.files));
  const resultBlob = await baseZip.generateAsync({ type: "blob" });
  saveAs(resultBlob, `${artifactId}.zip`);
};

/* // Función para generar el código de las relaciones entre entidades
const generateRelationshipCode = (rel, currentClassName) => {
  // Verifica que 'rel' tenga las propiedades necesarias
  if (!rel || !rel.from || !rel.to || !rel.type) return "";

  // Extrae las propiedades con valores por defecto si es necesario
  const { from, to, class1Multiplicity = "", class2Multiplicity = "" } = rel;
  const targetClass = from === currentClassName ? to : from;

  // Construir las relaciones de acuerdo con las multiplicidades
  const isManyToMany = class1Multiplicity === "*" && class2Multiplicity === "*";
  const isOneToMany =
    class1Multiplicity === "1" &&
    (class2Multiplicity === "*" ||
      class2Multiplicity === "0..*" ||
      class2Multiplicity === "1..*");
  const isManyToOne =
    (class1Multiplicity === "*" ||
      class1Multiplicity === "0..*" ||
      class1Multiplicity === "1..*") &&
    class2Multiplicity === "1";
  const isOneToOne = class1Multiplicity === "1" && class2Multiplicity === "1";

  const includeForeignKey = from === currentClassName;

  // Manejar las multiplicidades para generar las anotaciones adecuadas
  if (isManyToMany) {
    return `
    @ManyToMany
    @JoinTable(name = "${currentClassName.toLowerCase()}_${targetClass.toLowerCase()}",
      joinColumns = @JoinColumn(name = "id_${currentClassName.toLowerCase()}"),
      inverseJoinColumns = @JoinColumn(name = "id_${targetClass.toLowerCase()}"))
    private Set<${targetClass}> ${targetClass.toLowerCase()}s;
    `;
  } else if (isManyToOne) {
    if (currentClassName === to) {
      return `
      @ManyToOne
      @JoinColumn(name = "${to.toLowerCase()}_id")
      private ${to} ${to.toLowerCase()};
      `;
    } else {
      return `
      @OneToMany(mappedBy = "${to.toLowerCase()}")
      private Set<${from}> ${from.toLowerCase()}s;
      `;
    }
  } else if (isOneToMany) {
    if (currentClassName === from) {
      return `
      @OneToMany(mappedBy = "${from.toLowerCase()}")
      private Set<${to}> ${to.toLowerCase()}s;
      `;
    } else {
      return `
      @ManyToOne
      @JoinColumn(name = "${from.toLowerCase()}_id")
      private ${from} ${from.toLowerCase()};
      `;
    }
  } else if (isOneToOne && includeForeignKey) {
    return `
    @OneToOne
    @JoinColumn(name = "id_${targetClass.toLowerCase()}") 
    private ${targetClass} ${targetClass.toLowerCase()};
    `;
  }
  return ""; // Si no coincide con ningún caso, retornar vacío
}; */
