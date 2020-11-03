export default function hover(node, params) {
  const bindEventHandler = () => {
    Array.from(node.children).forEach((node) => {
      node.addEventListener("mousedown", params.handler);
    });
  };

  bindEventHandler();
}
