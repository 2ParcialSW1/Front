import { useEffect, useRef } from "react";
import mermaid from "mermaid";
import debounce from 'debounce';
import PropTypes from 'prop-types';

const DEFAULT_CONFIG = {
  startOnLoad: true,
  theme: "default",
  securityLevel: "loose",
  themeCSS: `
    g.classGroup rect {
      fill: #282a36;
      stroke: #6272a4;
    } 
    g.classGroup text {
      fill: #f8f8f2;
    }
    g.classGroup line {
      stroke: #f8f8f2;
      stroke-width: 0.5;
    }
    .classLabel .box {
      stroke: #21222c;
      stroke-width: 3;
      fill: #21222c;
      opacity: 1;
    }
    .classLabel .label {
      fill: #f1fa8c;
    }
    .relation {
      stroke: #ff79c6;
      stroke-width: 1;
    }
    #compositionStart, #compositionEnd {
      fill: #bd93f9;
      stroke: #bd93f9;
      stroke-width: 1;
    }
    #aggregationEnd, #aggregationStart {
      fill: #21222c;
      stroke: #50fa7b;
      stroke-width: 1;
    }
    #dependencyStart, #dependencyEnd {
      fill: #00bcd4;
      stroke: #00bcd4;
      stroke-width: 1;
    } 
    #extensionStart, #extensionEnd {
      fill: #f8f8f2;
      stroke: #f8f8f2;
      stroke-width: 1;
    }`,
  fontFamily: "Fira Code"
};


const MermaidComponent = ({ chart/* , config */ }) => {
  const chartRef = useRef(chart);

  useEffect(() => {
    // Actualiza la referencia de chart cada vez que cambie
    chartRef.current = chart;
    console.log('chartRef', chartRef.current);
  }, [chart]);

  useEffect(() => {
    /* const mergedConfig = { ...DEFAULT_CONFIG, ...config }; */
    const output = document.getElementById('output');

    const handle = debounce(() => {
      const currentChart = chartRef.current;

      try {
        console.log('id', currentChart);
        mermaid.render('id', currentChart).then(({ svg }) => {
          output.innerHTML = svg;
        });
        mermaid.initialize(DEFAULT_CONFIG);
      } catch (err) {
        console.error(err);
      }
    }, 500);

    handle();
  }, [chart]);

  return (
    <div className="mermaid">
      <div id="output"></div>
      {/* {chart} */}
    </div>
  );
};

MermaidComponent.propTypes = {
  chart: PropTypes.string.isRequired,
  /* config: PropTypes.object */
};

export default MermaidComponent;
