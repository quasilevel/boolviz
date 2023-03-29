class Node
    {
        constructor(data) {
           this.left = null;
           this.right = null;
           this.data = data;
        }
    }
 
    let str;
   
    /* Helper function that allocates a new node */
    function newNode(data) 
    { 
        let node = new Node(data); 
        return (node); 
    } 
 
    // Function to construct string from binary tree 
    function treeToString(root) 
    { 
        if (root == null) 
            return; 
 
        // root data as character 
        str += console.log(root.value); 
 
        // if leaf node, then return 
        if (root.left == null && root.right == null) 
            return; 
 
        // for left subtree 
        str += ('('); 
        treeToString(root.left); 
        str += (')'); 
 
        // if right child is present 
        if (root.right != null) 
        { 
            str += ('('); 
            treeToString(root.right); 
            str += (')'); 
        } 
    } 
    