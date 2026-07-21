import Navbar from './Navbar';

function Layout({ children }) {
  return (
    <div className="app-layout">
      <Navbar />
      <main>{children}</main>
    </div>
  );
}

export default Layout;