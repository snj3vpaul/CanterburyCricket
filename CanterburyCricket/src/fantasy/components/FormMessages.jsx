export default function FormMessages({ errors = [], message }) {
  if (errors.length) {
    return (
      <div role="alert" className="fx-alert fx-alert-error">
        <ul>{errors.map((e) => <li key={e}>{e}</li>)}</ul>
      </div>
    );
  }
  if (message) return <div role="status" className="fx-alert fx-alert-ok">{message}</div>;
  return null;
}
